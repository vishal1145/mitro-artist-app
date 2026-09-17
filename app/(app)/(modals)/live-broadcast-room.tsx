import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { ActivityRow, RoundChip } from '@components/live';
import { BottomSheet, ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { broadcastApi } from '@services/api/broadcastApi';
import { funWheelSpinsApi, rewardOrdersApi, type FunWheelSpinOrder, type RewardOrder } from '@services/api/liveDeliveryApi';
import { activeBroadcastStore } from '@services/broadcast/activeBroadcast';
import { broadcastHub } from '@services/realtime/broadcastHub';
import {
  destroyAgoraEngine,
  isAgoraAvailable,
  joinAsHost,
  requestCallPermissions,
  setLocalAudioEnabled,
  setLocalVideoEnabled,
  startLocalPreview,
  switchCamera,
} from '@services/agora/agoraEngine';
import type { BroadcastActivityItem, BroadcastViewer, StartBroadcastResponse } from '@app-types/broadcast';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';
import { showToast } from '@utils/toast';

// The round chips, the activity-row markup and the room palette now live in
// @components/live, shared with the group call and private call rooms.

const formatElapsed = (t: number) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const ACTIVITY_POLL_MS = 15000;
const VIEWERS_POLL_MS = 5000;
const DELIVERIES_POLL_MS = 12000;
const HEARTBEAT_MS = 15000;

const LiveBroadcastRoomScreen = () => {
  const router = useRouter();
  const { sessionConfig } = useLocalSearchParams<{ sessionConfig?: string }>();

  const config = (() => {
    try {
      return sessionConfig
        ? (JSON.parse(sessionConfig) as {
            title?: string;
            category?: string;
            description?: string;
            highlightedMessagePrice?: number;
          })
        : {};
    } catch {
      return {};
    }
  })();
  const displayTitle = (config.title || 'Untitled stream').trim();
  // Shown in the live header — overridden from the persisted record on rejoin
  // (when there's no sessionConfig param) so the real title/category still show.
  const [liveTitle, setLiveTitle] = useState(displayTitle);
  const [liveCategory, setLiveCategory] = useState<string | undefined>(config.category);

  const [status, setStatus] = useState<'ready' | 'starting' | 'live'>('starting');
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewer, setPeakViewer] = useState(0);
  const [activity, setActivity] = useState<BroadcastActivityItem[]>([]);
  const [viewers, setViewers] = useState<BroadcastViewer[]>([]);
  const [pendingRewards, setPendingRewards] = useState<RewardOrder[]>([]);
  const [pendingSpins, setPendingSpins] = useState<FunWheelSpinOrder[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [videoKey, setVideoKey] = useState(0);
  const [panel, setPanel] = useState<'chat' | 'viewers' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const idRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const liveStartedRef = useRef(false);
  const endedRef = useRef(false);
  const chatRef = useRef<ScrollView>(null);
  const confirmResolveRef = useRef<(() => void) | null>(null);
  const videoAvailable = isAgoraAvailable();

  const sessionEarnings = activity.reduce((sum, i) => sum + (i.priceCharged || 0), 0);
  const sessionGifts = activity.filter((i) => i.type === 'reward').length;
  const pendingCount = pendingRewards.length + pendingSpins.length;

  const mergeActivity = useCallback((incoming: BroadcastActivityItem[]) => {
    setActivity((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i] as const));
      for (const item of incoming) byId.set(item.id, item);
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime(),
      );
    });
  }, []);

  const refreshActivity = useCallback(() => {
    const id = idRef.current;
    if (id) broadcastApi.getActivity(id, 100).then((r) => r.success && mergeActivity(r.data));
  }, [mergeActivity]);

  const refreshViewers = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    broadcastApi.getViewers(id).then((r) => {
      if (r.success) {
        setViewers(r.data.viewers);
        setViewerCount(r.data.viewerCount);
        setPeakViewer((p) => Math.max(p, r.data.viewerCount));
      }
    });
  }, []);

  const refreshDeliveries = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    rewardOrdersApi.list('pending', 100, id).then((r) => r.success && setPendingRewards(r.data));
    funWheelSpinsApi.list('pending', 100, id).then((r) => r.success && setPendingSpins(r.data));
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Kick the local camera pipeline off immediately so the preview surface has
    // something to bind to the moment it mounts (otherwise it renders black
    // until the camera is toggled).
    if (videoAvailable) startLocalPreview();

    let elapsedTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let activityTimer: ReturnType<typeof setInterval> | null = null;
    let viewersTimer: ReturnType<typeof setInterval> | null = null;
    let deliveriesTimer: ReturnType<typeof setInterval> | null = null;
    let rebindTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      await requestCallPermissions();

      // Resume an already-live broadcast if we left one running (back button),
      // otherwise start a fresh one — this is what lets the artist re-enter
      // their live room instead of hitting "already broadcasting live".
      let conn: StartBroadcastResponse | null = null;
      const active = await activeBroadcastStore.get();
      if (active) {
        const rj = await broadcastApi.rejoin(active.broadcastId);
        if (rj.success) {
          conn = rj.data;
          idRef.current = active.broadcastId;
          setLiveTitle(active.title);
          setLiveCategory(active.category);
          // Resume the timer from when the broadcast actually started.
          if (active.startedAt) setElapsed(Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000)));
        } else {
          await activeBroadcastStore.clear();
        }
      }
      if (!conn) {
        // Fresh broadcast → show the START SHOW confirmation (camera preview is
        // already up) and only actually go live once the artist taps it.
        setStatus('ready');
        setAwaitingConfirm(true);
        await new Promise<void>((resolve) => {
          confirmResolveRef.current = resolve;
        });
        confirmResolveRef.current = null;
        if (endedRef.current) return; // cancelled / left the screen
        setAwaitingConfirm(false);
        setStatus('starting');

        const startRes = await broadcastApi.start({
          title: displayTitle,
          description: config.description,
          category: config.category,
        });
        if (!startRes.success) {
          showToast(startRes.error, 'error');
          router.back();
          return;
        }
        conn = startRes.data;
        idRef.current = conn.broadcastId;
        await activeBroadcastStore.save(displayTitle, config.category, conn);
        if (typeof config.highlightedMessagePrice === 'number' && config.highlightedMessagePrice > 0) {
          broadcastApi.setHighlightedMessagePrice(conn.broadcastId, config.highlightedMessagePrice);
        }
      }
      const broadcastId = idRef.current!;
      const { agoraChannelName, agoraUid, agoraToken } = conn;

      const goLive = () => {
        if (liveStartedRef.current || endedRef.current) return;
        liveStartedRef.current = true;
        setStatus('live');
        // Remount the local video surface now that the engine has joined and
        // the camera is publishing — this binds the preview reliably.
        setVideoKey((k) => k + 1);
        rebindTimer = setTimeout(() => setVideoKey((k) => k + 1), 1200);
        broadcastApi.confirmConnected(broadcastId);
        elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
        heartbeatTimer = setInterval(() => broadcastApi.heartbeat(broadcastId), HEARTBEAT_MS);
        activityTimer = setInterval(refreshActivity, ACTIVITY_POLL_MS);
        viewersTimer = setInterval(refreshViewers, VIEWERS_POLL_MS);
        deliveriesTimer = setInterval(refreshDeliveries, DELIVERIES_POLL_MS);
        refreshActivity();
        refreshViewers();
        refreshDeliveries();
        broadcastHub.connect(broadcastId, {
          onActivityAdded: (item) => mergeActivity([item]),
          onViewerCountChanged: (count) => {
            setViewerCount(count);
            setPeakViewer((p) => Math.max(p, count));
          },
          onFulfillmentUpdated: (p) => {
            setActivity((prev) => prev.map((it) => (it.id === p.id ? { ...it, status: p.status } : it)));
            refreshDeliveries();
          },
          onBroadcastEnded: () => exitToSummary(),
        });
      };

      if (videoAvailable) {
        joinAsHost(agoraChannelName, agoraUid, agoraToken, {
          onJoinSuccess: goLive,
          onError: (msg) => setErrorBanner(msg),
        });
        setTimeout(() => {
          if (!endedRef.current && idRef.current) goLive();
        }, 4000);
      } else {
        goLive();
      }
    })();

    return () => {
      endedRef.current = true;
      confirmResolveRef.current?.(); // unblock the START SHOW gate if still waiting
      [elapsedTimer, heartbeatTimer, activityTimer, viewersTimer, deliveriesTimer].forEach((t) => t && clearInterval(t));
      if (rebindTimer) clearTimeout(rebindTimer);
      broadcastHub.disconnect();
      destroyAgoraEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitToSummary = () => {
    // No "That's a wrap" summary — the web just returns to the dashboard.
    router.replace('/(app)/(tabs)/home');
  };

  const endBroadcast = async () => {
    if (isEnding) return; // already ending — ignore repeat taps
    setIsEnding(true);
    const id = idRef.current;
    if (id) await broadcastApi.end(id);
    await activeBroadcastStore.clear();
    exitToSummary();
  };

  const handleSendChat = async () => {
    const text = chatText.trim();
    const id = idRef.current;
    if (!text || !id || sendingChat) return;
    setSendingChat(true);
    setChatText('');
    const res = await broadcastApi.sendChatMessage(id, text);
    if (res.success) refreshActivity(); // pull immediately instead of waiting on the 15s poll / hub push
    else setChatText(text);
    setSendingChat(false);
  };

  const fulfillReward = async (order: RewardOrder) => {
    setFulfillingId(order.id);
    const res = await rewardOrdersApi.fulfill(order.id);
    if (res.success) {
      setPendingRewards((prev) => prev.filter((o) => o.id !== order.id));
      setActivity((prev) => prev.map((it) => (it.id === order.id ? { ...it, status: 'fulfilled' } : it)));
    }
    setFulfillingId(null);
  };
  const fulfillSpin = async (spin: FunWheelSpinOrder) => {
    setFulfillingId(spin.id);
    const res = await funWheelSpinsApi.fulfill(spin.id);
    if (res.success) {
      setPendingSpins((prev) => prev.filter((s) => s.id !== spin.id));
      setActivity((prev) => prev.map((it) => (it.id === spin.id ? { ...it, status: 'fulfilled' } : it)));
    }
    setFulfillingId(null);
  };

  const removeViewer = async (v: BroadcastViewer) => {
    const id = idRef.current;
    if (!id) return;
    setRemovingId(v.userId);
    const res = await broadcastApi.removeViewer(id, v.userId);
    if (res.success) setViewers((prev) => prev.filter((x) => x.userId !== v.userId));
    setRemovingId(null);
  };

  const toggleMic = () =>
    setMicOn((v) => {
      setLocalAudioEnabled(!v);
      return !v;
    });
  const toggleCam = () =>
    setCamOn((v) => {
      setLocalVideoEnabled(!v);
      if (v === false) setVideoKey((k) => k + 1); // turning back on → rebind
      return !v;
    });

  const deliveryRows = (
    icon: 'gift' | 'star',
    title: string,
    count: number,
    rows: ReactNode,
  ) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHead}>
        <Feather name={icon} size={rf(16)} color={colors.gold} />
        <Text variant="bodyLg" color="textPrimary" style={styles.bold}>{title}{count > 0 ? ` (${count} pending)` : ''}</Text>
      </View>
      {count === 0 ? <Text variant="bodySm" color="textMuted">Nothing owed right now.</Text> : rows}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header — stream title · category · LIVE / timer / viewers */}
      {!isFullscreen ? (
        <View style={styles.header}>
          <View style={styles.headerCreator}>
            <View style={styles.headerNameRow}>
              <View style={styles.liveBadge}>
                {status === 'live' ? <View style={styles.liveBadgeDot} /> : null}
                <Text style={styles.liveBadgeText}>{status === 'live' ? 'LIVE' : 'GOING LIVE'}</Text>
              </View>
              <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={styles.headerName}>{liveTitle}</Text>
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>{liveCategory || 'Live now'}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerPill}>
              <Feather name="clock" size={rf(12)} color={colors.textPrimary} />
              <Text style={styles.headerPillText}>{formatElapsed(elapsed)}</Text>
            </View>
            <View style={styles.headerPill}>
              <Feather name="users" size={rf(12)} color={colors.textPrimary} />
              <Text style={styles.headerPillText}>{viewerCount}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {errorBanner && !isFullscreen ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={rf(13)} color={colors.onError} />
          <Text variant="caption" color="onError">{errorBanner}</Text>
        </View>
      ) : null}

      {/* ── Video area ── */}
      <View style={[styles.videoArea, isFullscreen && styles.videoAreaFull]}>
        {videoAvailable && camOn ? (
          <AgoraVideoView key={videoKey} uid={0} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.stagePlaceholder}>
            <Feather name={camOn ? 'video' : 'video-off'} size={rf(40)} color={colors.textMuted} />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>{camOn ? 'Camera is starting…' : 'Camera is off'}</Text>
            {camOn ? <Text variant="bodySm" color="textMuted">Please allow camera permissions.</Text> : null}
          </View>
        )}

        <Pressable
          style={[styles.fsPill, isFullscreen && styles.fsPillFull]}
          onPress={() => setIsFullscreen((v) => !v)}
          hitSlop={10}
          accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Feather name={isFullscreen ? 'minimize-2' : 'maximize-2'} size={rf(13)} color="#fff" />
          <Text style={styles.fsPillText}>{isFullscreen ? 'Exit' : 'Full Screen'}</Text>
        </Pressable>

        <View style={[styles.quickControls, isFullscreen && styles.fsPillFull]}>
          <Pressable style={[styles.quickBtn, !camOn && styles.quickBtnMuted]} onPress={toggleCam} accessibilityLabel="Toggle camera">
            <Feather name={camOn ? 'video' : 'video-off'} size={rf(16)} color={camOn ? colors.textPrimary : '#FF8A97'} />
          </Pressable>
          <Pressable style={[styles.quickBtn, !micOn && styles.quickBtnMuted]} onPress={toggleMic} accessibilityLabel="Toggle mic">
            <Feather name={micOn ? 'mic' : 'mic-off'} size={rf(16)} color={micOn ? colors.textPrimary : '#FF8A97'} />
          </Pressable>
          {videoAvailable ? (
            <Pressable style={styles.quickBtn} onPress={switchCamera} accessibilityLabel="Flip camera">
              <Feather name="refresh-cw" size={rf(16)} color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── Chat / Viewers panel (opened from the round bar) ── */}
      {!isFullscreen && panel === 'chat' ? (
        <View style={styles.panelSection}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>LIVE CHAT</Text>
            <View style={styles.panelHeaderRule} />
            <Pressable style={styles.panelClose} onPress={() => setPanel(null)} hitSlop={8} accessibilityLabel="Close chat">
              <Feather name="x" size={rf(16)} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView ref={chatRef} style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
            {activity.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
                <Text variant="bodyLg" color="textPrimary" style={styles.bold}>It&apos;s quiet in here</Text>
                <Text variant="bodySm" color="textMuted" align="center">Once you&apos;re live, chat, reactions, and reward purchases will show up here as they happen.</Text>
              </View>
            ) : activity.map((item) => <ActivityRow key={item.id} item={item} />)}
          </ScrollView>
          <View style={styles.composeRow}>
            <TextInput style={styles.chatInput} value={chatText} onChangeText={setChatText} placeholder="Say something as the host..." placeholderTextColor={colors.textMuted} onSubmitEditing={handleSendChat} returnKeyType="send" maxLength={300} />
            <Pressable style={styles.sendBtn} onPress={handleSendChat} disabled={!chatText.trim() || sendingChat}>
              {sendingChat ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="send" size={rf(16)} color={colors.white} />}
            </Pressable>
          </View>
        </View>
      ) : null}

      {!isFullscreen && panel === 'viewers' ? (
        <View style={styles.panelSection}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>VIEWERS ({viewerCount})</Text>
            <View style={styles.panelHeaderRule} />
            <Pressable style={styles.panelClose} onPress={() => setPanel(null)} hitSlop={8} accessibilityLabel="Close viewers">
              <Feather name="x" size={rf(16)} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.feed} contentContainerStyle={styles.viewerList} showsVerticalScrollIndicator={false}>
            {viewers.length === 0 ? (
              <Text variant="bodySm" color="textMuted" style={styles.viewerEmpty}>No viewers connected yet — this list refreshes every 5 seconds.</Text>
            ) : viewers.map((v) => (
              <View key={v.userId} style={styles.viewerRow}>
                <Avatar initials={(v.displayName || '?').slice(0, 1).toUpperCase()} size="sm" />
                <View style={styles.viewerBody}>
                  <Text variant="caption" color="textPrimary" numberOfLines={1}>{v.displayName}</Text>
                  <Text variant="label" color="green">{v.connectionStatus}</Text>
                </View>
                <Pressable style={styles.kickBtn} onPress={() => removeViewer(v)} disabled={removingId === v.userId} accessibilityLabel="Remove viewer">
                  <Feather name="user-x" size={rf(15)} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* ── Round action bar ── */}
      {!isFullscreen ? (
        <View style={styles.roundBar}>
          <RoundChip variant="danger" icon="phone-off" label="End show" onPress={() => setConfirmingEnd(true)} />
          <RoundChip variant="neutral" icon="message-circle" label="Chat" onPress={() => setPanel((p) => (p === 'chat' ? null : 'chat'))} active={panel === 'chat'} />
          <RoundChip variant="neutral" icon="users" label="Viewers" onPress={() => setPanel((p) => (p === 'viewers' ? null : 'viewers'))} active={panel === 'viewers'} />
          <RoundChip variant="gift" icon="gift" label="Manage rewards" onPress={() => setManageOpen(true)} badge={pendingCount} />
          <RoundChip variant="stats" icon="bar-chart-2" label="Session stats" onPress={() => setStatsOpen(true)} />
        </View>
      ) : null}

      {/* Manage bottom sheet */}
      <BottomSheet visible={manageOpen} onClose={() => setManageOpen(false)} title="Manage this stream" snapPoints={[0.6]}>
        <View style={styles.sheetBody}>
          {deliveryRows(
            'gift',
            'Reward deliveries',
            pendingRewards.length,
            pendingRewards.map((o) => (
              <View key={o.id} style={styles.deliveryRow}>
                <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}>
                  <Text variant="caption" color="textPrimary" style={styles.bold}>{o.rewardName}</Text> for {o.buyerDisplayName} · {o.priceCharged} tk
                </Text>
                <Pressable style={styles.markBtn} onPress={() => fulfillReward(o)} disabled={fulfillingId === o.id}>
                  {fulfillingId === o.id ? <ActivityIndicator size="small" color={colors.white} /> : (<><Feather name="check" size={rf(13)} color={colors.white} /><Text variant="label" color="onPrimary" style={styles.bold}>Mark fulfilled</Text></>)}
                </Pressable>
              </View>
            )),
          )}
          {deliveryRows(
            'star',
            'Fun-wheel prizes',
            pendingSpins.length,
            pendingSpins.map((s) => (
              <View key={s.id} style={styles.deliveryRow}>
                <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}>
                  <Text variant="caption" color="textPrimary" style={styles.bold}>{s.activityName}</Text> for {s.buyerDisplayName} · {s.priceCharged} tk
                </Text>
                <Pressable style={styles.markBtn} onPress={() => fulfillSpin(s)} disabled={fulfillingId === s.id}>
                  {fulfillingId === s.id ? <ActivityIndicator size="small" color={colors.white} /> : (<><Feather name="check" size={rf(13)} color={colors.white} /><Text variant="label" color="onPrimary" style={styles.bold}>Mark fulfilled</Text></>)}
                </Pressable>
              </View>
            )),
          )}
        </View>
      </BottomSheet>

      {/* Session stats bottom sheet */}
      <BottomSheet visible={statsOpen} onClose={() => setStatsOpen(false)} title="Session stats" snapPoints={[0.36]}>
        <View style={styles.statsSheet}>
          <View style={styles.statCell}>
            <View style={[styles.statIc, { backgroundColor: colors.successChip }]}><Feather name="dollar-sign" size={rf(16)} color={colors.green} /></View>
            <Text variant="label" color="textMuted">EARNINGS</Text>
            <Text variant="h2" color="green">{sessionEarnings}</Text>
          </View>
          <View style={styles.statCell}>
            <View style={[styles.statIc, { backgroundColor: colors.cyanSoft }]}><Feather name="users" size={rf(16)} color={colors.cyan} /></View>
            <Text variant="label" color="textMuted">PEAK</Text>
            <Text variant="h2" color="textPrimary">{peakViewer}</Text>
          </View>
          <View style={styles.statCell}>
            <View style={[styles.statIc, { backgroundColor: colors.pinkSoft }]}><Feather name="gift" size={rf(16)} color={colors.pink} /></View>
            <Text variant="label" color="textMuted">GIFTS</Text>
            <Text variant="h2" color="textPrimary">{sessionGifts}</Text>
          </View>
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmingEnd}
        title="End broadcast?"
        message="This disconnects every viewer, closes the session, and can't be undone. You'll need to start a new broadcast to go live again."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmLoading={isEnding}
        onConfirm={endBroadcast}
        onCancel={() => { if (!isEnding) setConfirmingEnd(false); }}
      />

      {/* ── START SHOW confirmation — web "Stream studio" (OFFLINE) layout ── */}
      {awaitingConfirm ? (
        <View style={styles.confirmOverlay}>
          {/* Header */}
          <View style={styles.confirmHeader}>
            <Pressable style={styles.confirmBack} onPress={() => router.back()} accessibilityLabel="Back">
              <Feather name="arrow-left" size={rf(18)} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.confirmTitleWrap}>
              <View style={styles.confirmEyebrow}>
                <Feather name="map-pin" size={rf(13)} color="#FFB7DF" />
                <Text style={styles.confirmEyebrowText}>Stream studio</Text>
              </View>
              <View style={styles.confirmTitleRow}>
                <Text variant="h2" color="textPrimary" numberOfLines={1} style={styles.confirmTitle}>{displayTitle}</Text>
                <Feather name="mic" size={rf(15)} color={colors.textMuted} />
              </View>
            </View>
            <View style={styles.confirmStats}>
              <View style={styles.offlinePill}>
                <View style={styles.offlineDot} />
                <Text style={styles.offlinePillText}>OFFLINE</Text>
              </View>
              <View style={styles.timerRow}>
                <Feather name="clock" size={rf(13)} color={colors.textMuted} />
                <Text variant="bodySm" color="textMuted">00:00</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressSegments}>
              <View style={[styles.progSeg, styles.progSegFilled]} />
              <View style={styles.progSeg} />
              <View style={styles.progSeg} />
              <View style={styles.progSeg} />
            </View>
            <Text style={styles.confirmProgressText}>
              Your broadcast session is ready. Whenever you are — hit Start Show to connect your camera and go live.
            </Text>
          </View>

          {/* Camera stage */}
          <View style={styles.confirmStage}>
            <View style={styles.cameraBadge}>
              <View style={styles.cameraBadgeDot} />
              <Text style={styles.cameraBadgeText}>OFFLINE</Text>
            </View>
            <View style={styles.stageQuick}>
              <Pressable style={[styles.stageQuickBtn, camOn ? null : styles.stageQuickMuted]} onPress={toggleCam} accessibilityLabel="Toggle camera">
                <Feather name={camOn ? 'video' : 'video-off'} size={rf(16)} color={camOn ? colors.textPrimary : '#FF8A97'} />
              </Pressable>
              {videoAvailable ? (
                <Pressable style={styles.stageQuickBtn} onPress={switchCamera} disabled={!camOn} accessibilityLabel="Flip camera">
                  <Feather name="refresh-cw" size={rf(16)} color={colors.textPrimary} />
                </Pressable>
              ) : null}
              <Pressable style={[styles.stageQuickBtn, micOn ? null : styles.stageQuickMuted]} onPress={toggleMic} accessibilityLabel="Toggle mic">
                <Feather name={micOn ? 'mic' : 'mic-off'} size={rf(16)} color={micOn ? colors.textPrimary : '#FF8A97'} />
              </Pressable>
            </View>
            {videoAvailable && camOn ? (
              <AgoraVideoView key={`ready-${videoKey}`} uid={0} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.confirmPlaceholder}>
                <Feather name="video-off" size={rf(52)} color="rgba(255,255,255,0.6)" />
                <Text style={styles.confirmPlaceholderTitle}>{camOn ? 'Camera preview' : 'Camera is off'}</Text>
                <Text variant="bodySm" color="textSecondary" align="center" style={styles.confirmPlaceholderHint}>
                  {camOn
                    ? "This mirrors where your live feed renders once you're on air."
                    : 'Turn it back on to show your live feed.'}
                </Text>
              </View>
            )}
          </View>

          {/* START SHOW */}
          <Pressable style={styles.startShow} onPress={() => confirmResolveRef.current?.()} accessibilityLabel="Start show">
            <LinearGradient colors={['#FF3FAD', '#8C4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startShowFill}>
              <Feather name="play" size={rf(14)} color={colors.white} />
              <Text style={styles.startShowText}>START SHOW</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  titleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minWidth: 0 },
  title: { flexShrink: 1, fontFamily: fontFamily.extrabold },
  studioStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.error, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  livePillStarting: { backgroundColor: colors.warning },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.white },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.chipSurface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  progressBanner: { marginHorizontal: spacing.md, marginBottom: spacing.xs, backgroundColor: colors.glassSurface, borderRadius: radius.md, padding: spacing.sm, gap: 6 },
  progressSegs: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segFilled: { backgroundColor: colors.pink },
  progressText: { lineHeight: rf(17) },
  bold: { fontFamily: fontFamily.bold },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  confirmBack: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitleWrap: { flex: 1, gap: 4 },
  confirmEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmEyebrowText: { fontFamily: fontFamily.extrabold, fontSize: rf(12), letterSpacing: 0.3, color: '#FFB7DF' },
  confirmTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmTitle: { flexShrink: 1 },
  confirmStats: { alignItems: 'flex-end', gap: 6 },
  offlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  offlinePillText: { fontFamily: fontFamily.extrabold, fontSize: rf(11), letterSpacing: 0.5, color: colors.textPrimary },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  progressBar: {
    gap: 10,
    marginTop: spacing.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  progressSegments: { flexDirection: 'row', gap: 6 },
  progSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  progSegFilled: { backgroundColor: colors.pink },
  confirmProgressText: { fontFamily: fontFamily.body, fontSize: rf(12.5), lineHeight: rf(19), color: colors.textSecondary },
  confirmStage: {
    flex: 1,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#05040B',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5,4,11,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cameraBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  cameraBadgeText: { fontFamily: fontFamily.extrabold, fontSize: rf(10.5), letterSpacing: 0.4, color: colors.textPrimary },
  stageQuick: { position: 'absolute', top: 14, right: 14, zIndex: 2, flexDirection: 'row', gap: 8 },
  stageQuickBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(5,4,11,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageQuickMuted: { borderColor: 'rgba(239,68,68,0.45)', backgroundColor: 'rgba(239,68,68,0.14)' },
  confirmPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 28 },
  confirmPlaceholderTitle: { fontFamily: fontFamily.bold, fontSize: rf(15), color: colors.white },
  confirmPlaceholderHint: { lineHeight: rf(18) },
  startShow: { height: 52, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  startShowFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startShowText: { fontFamily: fontFamily.extrabold, fontSize: rf(14), letterSpacing: 0.6, color: colors.white },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.error, marginHorizontal: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },

  half: { flex: 1, paddingHorizontal: spacing.md },
  stage: { flex: 1, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  stagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20 },
  quickControls: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', gap: spacing.xs },
  quickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.chipSurfaceStrong, alignItems: 'center', justifyContent: 'center' },

  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  endShow: { flex: 1, height: 46, borderRadius: radius.pill, overflow: 'hidden' },
  endShowFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  endShowText: { fontFamily: fontFamily.extrabold, fontSize: rf(13), letterSpacing: 0.5, color: colors.white },
  manageBtn: { width: 52, height: 46, borderRadius: radius.card, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pendingPill: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.error, borderRadius: radius.pill, minWidth: 16, paddingHorizontal: 4, alignItems: 'center' },

  panel: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, overflow: 'hidden' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm + 2 },
  tabActive: { backgroundColor: colors.pinkSoft },
  feed: { flex: 1 },
  feedContent: { padding: spacing.sm, gap: spacing.sm },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.xl },
  actRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 10 },
  actBody: { flex: 1, minWidth: 0, gap: 2 },
  actNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  actRowHighlighted: { backgroundColor: 'rgba(255,200,107,0.1)', borderLeftWidth: 3, borderLeftColor: '#FFC86B', borderRadius: 8, paddingLeft: 9 },
  actName: { fontFamily: fontFamily.extrabold },
  actDetail: { color: 'rgba(255,250,255,0.72)' },
  highlightDetail: { color: '#FFD68A', fontFamily: fontFamily.semibold, fontStyle: 'italic' },
  hostBadge: { backgroundColor: 'rgba(124,92,255,0.16)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  hostBadgeText: { fontFamily: fontFamily.extrabold, fontSize: rf(9), letterSpacing: 0.3, color: '#7C5CFF' },
  tokenPill: { backgroundColor: 'rgba(255,200,107,0.14)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  tokenPillText: { fontFamily: fontFamily.extrabold, fontSize: rf(10), color: '#FFC86B' },
  itemStatus: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 1 },
  itemStatusText: { fontFamily: fontFamily.bold, fontSize: rf(9.5), letterSpacing: 0.3 },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  chatInput: { flex: 1, height: wp(10), backgroundColor: colors.glassSurface, borderRadius: radius.pill, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: rf(13) },
  sendBtn: { width: wp(10), height: wp(10), borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  viewerList: { padding: spacing.sm, gap: spacing.sm },
  viewerEmpty: { padding: spacing.md },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewerBody: { flex: 1, minWidth: 0 },
  kickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },

  // Header — user-call style
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  headerExit: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  headerCreator: { flex: 1, minWidth: 0, gap: 3 },
  headerCreatorText: { flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerName: { flexShrink: 1, fontFamily: fontFamily.bold },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: radius.pill, backgroundColor: '#E8192C' },
  liveBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  liveBadgeText: { fontFamily: fontFamily.extrabold, color: '#fff', fontSize: rf(10.5), letterSpacing: 0.5 },
  headerSub: { flexShrink: 1, fontFamily: fontFamily.semibold, color: 'rgba(255,255,255,0.62)', fontSize: rf(12) },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.42)' },
  headerPillText: { fontFamily: fontFamily.bold, color: colors.textPrimary, fontSize: rf(12) },

  // Video area
  videoArea: { flex: 1, marginHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: spacing.sm, borderRadius: 22, backgroundColor: '#090716', position: 'relative', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(140,77,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  videoAreaFull: { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 0, borderWidth: 0 },
  fsPill: { position: 'absolute', top: 12, left: 12, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.66)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  /* Fullscreen is inside the same SafeAreaView — the status-bar inset is
     already paid for, so the controls ride the stage's very top edge. */
  fsPillFull: { top: 6 },
  fsPillText: { fontFamily: fontFamily.bold, fontSize: rf(12.5), color: '#fff' },
  quickBtnMuted: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.45)', backgroundColor: 'rgba(239,68,68,0.14)' },

  // Chat / Viewers panel
  panelSection: { flex: 1, marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.backgroundAlt, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  panelHeaderText: { fontFamily: fontFamily.bold, color: colors.textMuted, fontSize: rf(11), letterSpacing: 1.1 },
  panelHeaderRule: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  panelClose: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },

  // Round action bar
  roundBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border },
  chip: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  chipGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 23 },
  chipBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },

  // Session-stats sheet
  statsSheet: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  statCell: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.md },
  statIc: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },

  sheetBody: { gap: spacing.sm, paddingTop: spacing.sm },
  deliveryCard: { backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 6 },
  deliveryRowText: { flex: 1 },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
});

export default LiveBroadcastRoomScreen;
