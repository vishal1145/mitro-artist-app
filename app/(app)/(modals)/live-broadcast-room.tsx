import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
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

const QUICK_EMOJIS = ['😀', '😂', '❤️', '🔥', '👏', '🎉', '😍', '😮', '😢', '👍', '🙏', '💯'];

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

  const [status, setStatus] = useState<'starting' | 'live'>('starting');
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
  const [activeTab, setActiveTab] = useState<'chat' | 'viewers'>('chat');
  const [manageOpen, setManageOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const idRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const liveStartedRef = useRef(false);
  const endedRef = useRef(false);
  const chatRef = useRef<ScrollView>(null);
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

    const bail = (message: string) => {
      setErrorBanner(message);
      Alert.alert("Couldn't go live", message, [{ text: 'OK', onPress: () => router.back() }]);
    };

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
        } else {
          await activeBroadcastStore.clear();
        }
      }
      if (!conn) {
        const startRes = await broadcastApi.start({
          title: displayTitle,
          description: config.description,
          category: config.category,
        });
        if (!startRes.success) return bail(startRes.error);
        conn = startRes.data;
        idRef.current = conn.broadcastId;
        await activeBroadcastStore.save(displayTitle, conn);
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
      [elapsedTimer, heartbeatTimer, activityTimer, viewersTimer, deliveriesTimer].forEach((t) => t && clearInterval(t));
      if (rebindTimer) clearTimeout(rebindTimer);
      broadcastHub.disconnect();
      destroyAgoraEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitToSummary = () => {
    const id = idRef.current;
    router.replace({ pathname: '/(app)/(modals)/broadcast-summary', params: { broadcastId: id ?? 'bc_live' } });
  };

  const endBroadcast = async () => {
    setConfirmingEnd(false);
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
    setShowEmoji(false);
    const res = await broadcastApi.sendChatMessage(id, text);
    if (!res.success) setChatText(text);
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

  const renderActivity = (c: BroadcastActivityItem) => {
    const initials = (c.displayName || '?').slice(0, 1).toUpperCase();
    const statusLabel =
      c.status === 'fulfilled' ? 'Delivered' : c.status === 'pending' ? 'Pending' : c.status === 'refunded' ? 'Refunded' : c.status === 'cancelled' ? 'Cancelled' : null;
    let detail: ReactNode = c.text;
    if (c.type === 'highlighted') detail = <Text variant="caption" color="gold">📌 &ldquo;{c.text}&rdquo;</Text>;
    else if (c.type === 'reaction') detail = <Text variant="caption" color="textSecondary">sent {c.iconUrl ?? c.extra ?? '❤️'}</Text>;
    else if (c.type === 'fun_wheel') detail = <Text variant="caption" color="textSecondary">✨ won &ldquo;{c.extra}&rdquo;</Text>;
    else if (c.type === 'reward') detail = <Text variant="caption" color="textSecondary">🎁 bought &ldquo;{c.extra}&rdquo;</Text>;
    return (
      <View key={c.id} style={styles.actRow}>
        <Avatar initials={initials} size="sm" />
        <View style={styles.actBody}>
          <View style={styles.actNameRow}>
            <Text variant="caption" color="pink" style={styles.bold}>{c.displayName}</Text>
            {c.isArtist ? <View style={styles.hostBadge}><Text variant="label" color="onPrimary" style={styles.hostBadgeText}>HOST</Text></View> : null}
            {c.priceCharged ? <Text variant="label" color="gold">+{c.priceCharged} tk</Text> : null}
            {statusLabel ? (
              <View style={[styles.statusPill, c.status === 'fulfilled' ? styles.statusOk : styles.statusPending]}>
                <Text variant="label" style={[styles.statusText, { color: c.status === 'fulfilled' ? colors.green : colors.gold }]}>{statusLabel}</Text>
              </View>
            ) : null}
          </View>
          {typeof detail === 'string' ? <Text variant="caption" color="textPrimary">{detail}</Text> : detail}
        </View>
      </View>
    );
  };

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
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text variant="h2" color="textPrimary" numberOfLines={1} style={styles.title}>{displayTitle}</Text>
          <Feather name="mic" size={rf(14)} color={colors.textMuted} />
          <Feather name="edit-2" size={rf(13)} color={colors.textMuted} />
        </View>
        <View style={styles.studioStats}>
          <View style={[styles.livePill, status !== 'live' && styles.livePillStarting]}>
            {status === 'live' ? <View style={styles.liveDot} /> : null}
            <Text variant="label" color="onError">{status === 'live' ? 'LIVE' : 'GOING LIVE'}</Text>
          </View>
          <View style={styles.statChip}>
            <Feather name="clock" size={rf(12)} color={colors.textPrimary} />
            <Text variant="label" color="textPrimary">{formatElapsed(elapsed)}</Text>
          </View>
          <View style={styles.statChip}>
            <Feather name="user" size={rf(12)} color={colors.textPrimary} />
            <Text variant="label" color="textPrimary">{viewerCount}</Text>
          </View>
        </View>
      </View>

      {errorBanner ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={rf(13)} color={colors.onError} />
          <Text variant="caption" color="onError">{errorBanner}</Text>
        </View>
      ) : null}

      {/* ── Camera half (50%) ── */}
      <View style={styles.half}>
        <View style={styles.stage}>
          {videoAvailable && camOn ? (
            <AgoraVideoView key={videoKey} uid={0} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.stagePlaceholder}>
              <Feather name={camOn ? 'video' : 'video-off'} size={rf(38)} color={colors.textMuted} />
              <Text variant="bodyLg" color="textPrimary" style={styles.bold}>{camOn ? 'Camera is starting...' : 'Camera is off'}</Text>
              {camOn ? <Text variant="bodySm" color="textMuted">Please allow camera permissions.</Text> : null}
            </View>
          )}
          <View style={styles.quickControls}>
            <Pressable style={styles.quickBtn} onPress={toggleCam} accessibilityLabel="Toggle camera">
              <Feather name={camOn ? 'video' : 'video-off'} size={rf(16)} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.quickBtn} onPress={toggleMic} accessibilityLabel="Toggle mic">
              <Feather name={micOn ? 'mic' : 'mic-off'} size={rf(16)} color={colors.textPrimary} />
            </Pressable>
            {videoAvailable ? (
              <Pressable style={styles.quickBtn} onPress={switchCamera} accessibilityLabel="Flip camera">
                <Feather name="refresh-cw" size={rf(16)} color={colors.textPrimary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {/* Controls row */}
      <View style={styles.controlsRow}>
        <Pressable style={styles.endShow} onPress={() => setConfirmingEnd(true)} accessibilityLabel="End show">
          <LinearGradient colors={['#FF5C7A', '#FF3FAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.endShowFill}>
            <Text style={styles.endShowText}>END SHOW</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.manageBtn} onPress={() => setManageOpen(true)} accessibilityLabel="Manage this stream">
          <Feather name="sliders" size={rf(16)} color={colors.textPrimary} />
          {pendingCount > 0 ? <View style={styles.pendingPill}><Text variant="label" color="onError">{pendingCount}</Text></View> : null}
        </Pressable>
      </View>

      {/* ── Chat half (50%) ── */}
      <View style={styles.half}>
        <View style={styles.panel}>
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, activeTab === 'chat' && styles.tabActive]} onPress={() => setActiveTab('chat')}>
              <Feather name="message-circle" size={rf(14)} color={activeTab === 'chat' ? colors.pink : colors.textMuted} />
              <Text variant="bodyLg" color={activeTab === 'chat' ? 'pink' : 'textMuted'} style={styles.bold}>Chat</Text>
            </Pressable>
            <Pressable style={[styles.tab, activeTab === 'viewers' && styles.tabActive]} onPress={() => setActiveTab('viewers')}>
              <Feather name="users" size={rf(14)} color={activeTab === 'viewers' ? colors.pink : colors.textMuted} />
              <Text variant="bodyLg" color={activeTab === 'viewers' ? 'pink' : 'textMuted'} style={styles.bold}>Viewers ({viewerCount})</Text>
            </Pressable>
          </View>

          {activeTab === 'chat' ? (
            <>
              <ScrollView ref={chatRef} style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
                {activity.length === 0 ? (
                  <View style={styles.empty}>
                    <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
                    <Text variant="bodyLg" color="textPrimary" style={styles.bold}>It&apos;s quiet in here</Text>
                    <Text variant="bodySm" color="textMuted" align="center">Once you&apos;re live, chat, reactions, and reward purchases will show up here as they happen.</Text>
                  </View>
                ) : activity.map(renderActivity)}
              </ScrollView>
              {showEmoji ? (
                <View style={styles.emojiRow}>
                  {QUICK_EMOJIS.map((e) => (<Pressable key={e} onPress={() => setChatText((t) => (t + e).slice(0, 300))} style={styles.emojiBtn}><Text variant="h2">{e}</Text></Pressable>))}
                </View>
              ) : null}
              <View style={styles.composeRow}>
                <Pressable style={styles.emojiToggle} onPress={() => setShowEmoji((v) => !v)}><Feather name="smile" size={rf(18)} color={colors.textMuted} /></Pressable>
                <TextInput style={styles.chatInput} value={chatText} onChangeText={setChatText} placeholder="Say something as the host..." placeholderTextColor={colors.textMuted} onSubmitEditing={handleSendChat} returnKeyType="send" maxLength={300} />
                <Pressable style={styles.sendBtn} onPress={handleSendChat} disabled={!chatText.trim() || sendingChat}>
                  {sendingChat ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="send" size={rf(16)} color={colors.white} />}
                </Pressable>
              </View>
            </>
          ) : (
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
          )}
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statCell}><Text variant="label" color="textMuted">EARNINGS</Text><Text variant="h3" color="green">{sessionEarnings}</Text></View>
        <View style={styles.statCell}><Text variant="label" color="textMuted">PEAK</Text><Text variant="h3" color="textPrimary">{peakViewer}</Text></View>
        <View style={styles.statCell}><Text variant="label" color="textMuted">GIFTS</Text><Text variant="h3" color="textPrimary">{sessionGifts}</Text></View>
      </View>

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

      <ConfirmDialog
        visible={confirmingEnd}
        icon="stop-circle"
        title="End show?"
        message="Your stream will end for everyone watching. You can review the summary afterwards."
        confirmLabel="End show"
        cancelLabel="Keep streaming"
        onConfirm={endBroadcast}
        onCancel={() => setConfirmingEnd(false)}
      />
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
  actRow: { flexDirection: 'row', gap: spacing.sm },
  actBody: { flex: 1, minWidth: 0 },
  actNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  hostBadge: { backgroundColor: colors.pink, borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 1 },
  hostBadgeText: { fontSize: rf(8) },
  statusPill: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  statusOk: { backgroundColor: colors.successChip },
  statusPending: { backgroundColor: colors.warningChip },
  statusText: { fontSize: rf(8), color: colors.textPrimary },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  emojiBtn: { padding: 4 },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  emojiToggle: { padding: 6 },
  chatInput: { flex: 1, height: wp(10), backgroundColor: colors.glassSurface, borderRadius: radius.pill, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: rf(13) },
  sendBtn: { width: wp(10), height: wp(10), borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  viewerList: { padding: spacing.sm, gap: spacing.sm },
  viewerEmpty: { padding: spacing.md },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewerBody: { flex: 1, minWidth: 0 },
  kickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },

  statsBar: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.sm },
  statCell: { flex: 1, alignItems: 'center', gap: 1 },

  sheetBody: { gap: spacing.sm, paddingTop: spacing.sm },
  deliveryCard: { backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 6 },
  deliveryRowText: { flex: 1 },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
});

export default LiveBroadcastRoomScreen;
