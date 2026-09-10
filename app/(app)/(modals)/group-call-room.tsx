import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { groupCallApi } from '@services/api/groupCallApi';
import { funWheelSpinsApi, rewardOrdersApi, type FunWheelSpinOrder, type RewardOrder } from '@services/api/liveDeliveryApi';
import { groupCallHub } from '@services/realtime/groupCallHub';
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
import type { GroupCallActivityItem, GroupCallParticipant } from '@app-types/groupCall';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

const QUICK_EMOJIS = ['😀', '😂', '❤️', '🔥', '👏', '🎉', '😍', '😮', '😢', '👍', '🙏', '💯'];
const CONNECTED = new Set(['connected', 'approved', 'reconnecting']);

const formatElapsed = (t: number) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const ACTIVITY_POLL_MS = 15000;
const PARTICIPANT_POLL_MS = 6000;
const DELIVERIES_POLL_MS = 12000;

const GroupCallRoomScreen = () => {
  const router = useRouter();
  const { sessionConfig, groupCallId: existingId } = useLocalSearchParams<{
    sessionConfig?: string;
    groupCallId?: string;
  }>();

  const config = (() => {
    try {
      return sessionConfig
        ? (JSON.parse(sessionConfig) as {
            title?: string;
            maxParticipants?: number;
            entryPrice?: number;
            requiresApproval?: boolean;
            mode?: 'audio' | 'video';
          })
        : {};
    } catch {
      return {};
    }
  })();
  const maxParticipants = config.maxParticipants ?? 8;
  const isAudioOnly = config.mode === 'audio';

  const [status, setStatus] = useState<'starting' | 'live'>('starting');
  const [elapsed, setElapsed] = useState(0);
  const [activity, setActivity] = useState<GroupCallActivityItem[]>([]);
  const [participants, setParticipants] = useState<GroupCallParticipant[]>([]);
  const [pendingRewards, setPendingRewards] = useState<RewardOrder[]>([]);
  const [pendingSpins, setPendingSpins] = useState<FunWheelSpinOrder[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [peak, setPeak] = useState(0);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!isAudioOnly);
  const [videoKey, setVideoKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'requests'>('chat');
  const [manageOpen, setManageOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const idRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const liveStartedRef = useRef(false);
  const endedRef = useRef(false);
  const chatRef = useRef<ScrollView>(null);
  const videoAvailable = isAgoraAvailable();

  const pending = participants.filter((p) => p.status === 'pending_approval' && !p.isRemoved);
  const connected = participants.filter((p) => CONNECTED.has(p.status) && !p.isRemoved);
  const sessionEarnings = activity.reduce((sum, i) => sum + (i.priceCharged || 0), 0);
  const sessionGifts = activity.filter((i) => i.type === 'reward').length;

  const mergeActivity = useCallback((incoming: GroupCallActivityItem[]) => {
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
    if (id) groupCallApi.getActivity(id, 100).then((r) => r.success && mergeActivity(r.data));
  }, [mergeActivity]);

  const refreshParticipants = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    groupCallApi.getParticipants(id).then((r) => {
      if (r.success) {
        setParticipants(r.data);
        const c = r.data.filter((p) => CONNECTED.has(p.status) && !p.isRemoved).length;
        setPeak((prev) => Math.max(prev, c));
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
    if (videoAvailable && !isAudioOnly) startLocalPreview();
    let elapsedTimer: ReturnType<typeof setInterval> | null = null;
    let actTimer: ReturnType<typeof setInterval> | null = null;
    let partTimer: ReturnType<typeof setInterval> | null = null;
    let delivTimer: ReturnType<typeof setInterval> | null = null;

    const bail = (message: string) => {
      setErrorBanner(message);
      Alert.alert("Couldn't start the group call", message, [{ text: 'OK', onPress: () => router.back() }]);
    };

    (async () => {
      await requestCallPermissions();
      let groupCallId = existingId ?? null;
      if (!groupCallId) {
        const createRes = await groupCallApi.create({
          title: (config.title || 'Group Call').trim(),
          maxParticipants,
          entryPrice: config.entryPrice ?? 0,
          requiresApproval: config.requiresApproval ?? true,
          audioOrVideoMode: config.mode ?? 'video',
        });
        if (!createRes.success) return bail(createRes.error);
        groupCallId = createRes.data.groupCallId;
      }
      idRef.current = groupCallId;

      const startRes = await groupCallApi.start(groupCallId);
      if (!startRes.success) return bail(startRes.error);
      const { agoraChannelName, agoraUid, agoraToken } = startRes.data;

      const goLive = () => {
        if (liveStartedRef.current || endedRef.current) return;
        liveStartedRef.current = true;
        setStatus('live');
        setVideoKey((k) => k + 1);
        setTimeout(() => setVideoKey((k) => k + 1), 1200);
        groupCallApi.confirmConnected(groupCallId!);
        elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
        actTimer = setInterval(refreshActivity, ACTIVITY_POLL_MS);
        partTimer = setInterval(refreshParticipants, PARTICIPANT_POLL_MS);
        delivTimer = setInterval(refreshDeliveries, DELIVERIES_POLL_MS);
        refreshActivity();
        refreshParticipants();
        refreshDeliveries();
        groupCallHub.connect(groupCallId!, {
          onActivityAdded: (item) => mergeActivity([item]),
          onParticipantRequested: () => refreshParticipants(),
          onParticipantsChanged: () => refreshParticipants(),
          onParticipantStatusChanged: () => refreshParticipants(),
          onFulfillmentUpdated: (p) => {
            setActivity((prev) => prev.map((it) => (it.id === p.id ? { ...it, status: p.status } : it)));
            refreshDeliveries();
          },
          onGroupCallEnded: () => exitBack(),
        });
      };

      if (videoAvailable && !isAudioOnly) {
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
      [elapsedTimer, actTimer, partTimer, delivTimer].forEach((t) => t && clearInterval(t));
      groupCallHub.disconnect();
      destroyAgoraEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/calls');
  };

  const endCall = async () => {
    setConfirmingEnd(false);
    const id = idRef.current;
    if (id) await groupCallApi.end(id);
    exitBack();
  };

  const handleSendChat = async () => {
    const text = chatText.trim();
    const id = idRef.current;
    if (!text || !id || sendingChat) return;
    setSendingChat(true);
    setChatText('');
    setShowEmoji(false);
    const res = await groupCallApi.sendChatMessage(id, text);
    if (!res.success) setChatText(text);
    setSendingChat(false);
  };

  const approve = async (userId: string) => {
    const id = idRef.current;
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, status: 'approved' } : p)));
    await groupCallApi.approveParticipant(id, userId);
    setBusyUserId(null);
    refreshParticipants();
  };
  const reject = async (userId: string) => {
    const id = idRef.current;
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    await groupCallApi.rejectParticipant(id, userId, 'Not this time');
    setBusyUserId(null);
  };
  const remove = async (userId: string) => {
    const id = idRef.current;
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    await groupCallApi.removeParticipant(id, userId, 'Removed by artist');
    setBusyUserId(null);
  };
  const toggleMute = async (p: GroupCallParticipant) => {
    const id = idRef.current;
    if (!id) return;
    setParticipants((prev) => prev.map((x) => (x.userId === p.userId ? { ...x, isMuted: !p.isMuted } : x)));
    if (p.isMuted) await groupCallApi.unmuteParticipant(id, p.userId);
    else await groupCallApi.muteParticipant(id, p.userId, 'Muted by artist');
  };

  const fulfillReward = async (o: RewardOrder) => {
    setFulfillingId(o.id);
    const res = await rewardOrdersApi.fulfill(o.id);
    if (res.success) {
      setPendingRewards((prev) => prev.filter((x) => x.id !== o.id));
      setActivity((prev) => prev.map((it) => (it.id === o.id ? { ...it, status: 'fulfilled' } : it)));
    }
    setFulfillingId(null);
  };
  const fulfillSpin = async (s: FunWheelSpinOrder) => {
    setFulfillingId(s.id);
    const res = await funWheelSpinsApi.fulfill(s.id);
    if (res.success) {
      setPendingSpins((prev) => prev.filter((x) => x.id !== s.id));
      setActivity((prev) => prev.map((it) => (it.id === s.id ? { ...it, status: 'fulfilled' } : it)));
    }
    setFulfillingId(null);
  };

  const toggleMic = () =>
    setMicOn((v) => {
      setLocalAudioEnabled(!v);
      return !v;
    });
  const toggleCam = () =>
    setCamOn((v) => {
      setLocalVideoEnabled(!v);
      if (v === false) setVideoKey((k) => k + 1);
      return !v;
    });

  const renderActivity = (c: GroupCallActivityItem) => {
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
            {c.isArtist ? (
              <View style={styles.hostBadge}><Text variant="label" color="onPrimary" style={styles.hostBadgeText}>HOST</Text></View>
            ) : null}
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

  const deliveryCard = (
    title: string,
    icon: 'gift' | 'star',
    count: number,
    rows: ReactNode,
  ) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHead}>
        <Feather name={icon} size={rf(16)} color={colors.gold} />
        <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
          {title}{count > 0 ? ` (${count} pending)` : ''}
        </Text>
      </View>
      {count === 0 ? <Text variant="bodySm" color="textMuted">Nothing owed right now.</Text> : rows}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text variant="h2" color="textPrimary" numberOfLines={1} style={styles.title}>
            {(config.title || 'Group Call').trim()}
          </Text>
          <View style={styles.seats}>
            <Feather name="users" size={rf(12)} color={colors.textMuted} />
            <Text variant="label" color="textMuted">{connected.length}/{maxParticipants}</Text>
          </View>
        </View>
        <View style={styles.studioStats}>
          <View style={[styles.livePill, status !== 'live' && styles.livePillStarting]}>
            {status === 'live' ? <View style={styles.liveDot} /> : null}
            <Text variant="label" color="onError">{status === 'live' ? 'LIVE' : 'STARTING'}</Text>
          </View>
          <View style={styles.statChip}>
            <Feather name="clock" size={rf(12)} color={colors.textPrimary} />
            <Text variant="label" color="textPrimary">{formatElapsed(elapsed)}</Text>
          </View>
        </View>
      </View>

      {/* Progress banner */}
      <View style={styles.progressBanner}>
        <View style={styles.progressSegs}>
          {[0, 1, 2, 3].map((i) => (<View key={i} style={[styles.seg, i < 3 && styles.segFilled]} />))}
        </View>
        <Text variant="bodySm" color="textSecondary" style={styles.progressText}>
          {status === 'live' ? (
            <>You&apos;re live — {connected.length} in the room. <Text variant="bodySm" color="textPrimary" style={styles.bold}>{sessionEarnings} tk</Text> earned so far.</>
          ) : (
            <>Connecting your call session… opening the room for participants.</>
          )}
        </Text>
      </View>

      {errorBanner ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={rf(13)} color={colors.onError} />
          <Text variant="caption" color="onError">{errorBanner}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Camera stage */}
        <View style={styles.stage}>
          {videoAvailable && camOn && !isAudioOnly ? (
            <AgoraVideoView key={videoKey} uid={0} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.stagePlaceholder}>
              <Feather name={isAudioOnly ? 'headphones' : camOn ? 'users' : 'video-off'} size={rf(40)} color={colors.textMuted} />
              <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
                {isAudioOnly ? 'Audio-only session' : camOn ? 'Camera is starting...' : 'Camera is off'}
              </Text>
              <Text variant="bodySm" color="textMuted">
                {isAudioOnly ? 'No camera for this call — just your voice.' : camOn ? 'Please allow camera permissions.' : 'Turn it back on to show your live feed.'}
              </Text>
            </View>
          )}
          <View style={styles.quickControls}>
            {!isAudioOnly ? (
              <Pressable style={styles.quickBtn} onPress={toggleCam} accessibilityLabel="Toggle camera">
                <Feather name={camOn ? 'video' : 'video-off'} size={rf(16)} color={colors.textPrimary} />
              </Pressable>
            ) : null}
            <Pressable style={styles.quickBtn} onPress={toggleMic} accessibilityLabel="Toggle mic">
              <Feather name={micOn ? 'mic' : 'mic-off'} size={rf(16)} color={colors.textPrimary} />
            </Pressable>
            {videoAvailable && !isAudioOnly ? (
              <Pressable style={styles.quickBtn} onPress={switchCamera} accessibilityLabel="Flip camera">
                <Feather name="refresh-cw" size={rf(16)} color={colors.textPrimary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* End Call */}
        <Pressable style={styles.endShow} onPress={() => setConfirmingEnd(true)} accessibilityLabel="End call">
          <LinearGradient colors={['#FF5C7A', '#FF3FAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.endShowFill}>
            <Feather name="x" size={rf(15)} color={colors.white} />
            <Text style={styles.endShowText}>End Call</Text>
          </LinearGradient>
        </Pressable>

        {/* Manage this call */}
        <Pressable style={styles.manageToggle} onPress={() => setManageOpen((v) => !v)}>
          <View style={styles.manageToggleLeft}>
            <Feather name="sliders" size={rf(16)} color={colors.textPrimary} />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>Manage this call</Text>
          </View>
          <View style={styles.manageToggleRight}>
            {pendingRewards.length + pendingSpins.length > 0 ? (
              <View style={styles.pendingPill}><Text variant="label" color="onError">{pendingRewards.length + pendingSpins.length} pending</Text></View>
            ) : null}
            <Feather name={manageOpen ? 'chevron-up' : 'chevron-down'} size={rf(18)} color={colors.textMuted} />
          </View>
        </Pressable>
        {manageOpen ? (
          <View style={styles.manageBody}>
            {deliveryCard(
              'Reward deliveries',
              'gift',
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
            {deliveryCard(
              'Fun-wheel prizes',
              'star',
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
        ) : null}

        {/* Chat / Participants / Requests */}
        <View style={styles.panel}>
          <View style={styles.tabs}>
            {(['chat', 'participants', 'requests'] as const).map((t) => {
              const label = t === 'chat' ? 'Chat' : t === 'participants' ? `Participants (${connected.length})` : `Requests (${pending.length})`;
              const icon = t === 'chat' ? 'message-circle' : t === 'participants' ? 'users' : 'user-plus';
              const on = activeTab === t;
              return (
                <Pressable key={t} style={[styles.tab, on && styles.tabActive]} onPress={() => setActiveTab(t)}>
                  <Feather name={icon} size={rf(13)} color={on ? colors.pink : colors.textMuted} />
                  <Text variant="bodySm" color={on ? 'pink' : 'textMuted'} style={styles.bold}>{label}</Text>
                  {t === 'requests' && pending.length > 0 ? <View style={styles.reqDot} /> : null}
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'chat' ? (
            <>
              <ScrollView ref={chatRef} style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
                {activity.length === 0 ? (
                  <View style={styles.empty}>
                    <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
                    <Text variant="bodyLg" color="textPrimary" style={styles.bold}>It&apos;s quiet in here</Text>
                    <Text variant="bodySm" color="textMuted" align="center">Once the call is live, chat, reactions, and reward purchases will show up here as they happen.</Text>
                  </View>
                ) : activity.map(renderActivity)}
              </ScrollView>
              {showEmoji ? (
                <View style={styles.emojiRow}>
                  {QUICK_EMOJIS.map((e) => (
                    <Pressable key={e} onPress={() => setChatText((t) => (t + e).slice(0, 300))} style={styles.emojiBtn}><Text variant="h2">{e}</Text></Pressable>
                  ))}
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
          ) : activeTab === 'participants' ? (
            <View style={styles.list}>
              {connected.length === 0 ? (
                <Text variant="bodySm" color="textMuted" style={styles.listEmpty}>No participants connected yet.</Text>
              ) : connected.map((p) => (
                <View key={p.userId} style={styles.personRow}>
                  <Avatar initials={(p.displayName || '?').slice(0, 1).toUpperCase()} size="sm" />
                  <Text variant="caption" color="textPrimary" style={styles.personName} numberOfLines={1}>{p.displayName || 'Fan'}</Text>
                  <Pressable style={styles.roundIcon} onPress={() => toggleMute(p)} accessibilityLabel="Mute">
                    <Feather name={p.isMuted ? 'mic-off' : 'mic'} size={rf(14)} color={p.isMuted ? colors.danger : colors.textPrimary} />
                  </Pressable>
                  <Pressable style={[styles.roundIcon, styles.kick]} onPress={() => remove(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Remove">
                    <Feather name="user-x" size={rf(14)} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.list}>
              {pending.length === 0 ? (
                <Text variant="bodySm" color="textMuted" style={styles.listEmpty}>No join requests right now.</Text>
              ) : pending.map((p) => (
                <View key={p.userId} style={styles.personRow}>
                  <Avatar initials={(p.displayName || '?').slice(0, 1).toUpperCase()} size="sm" />
                  <Text variant="caption" color="textPrimary" style={styles.personName} numberOfLines={1}>{p.displayName || 'Fan'}</Text>
                  <Pressable style={styles.approveBtn} onPress={() => approve(p.userId)} disabled={busyUserId === p.userId}>
                    <Feather name="check" size={rf(14)} color={colors.white} />
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => reject(p.userId)} disabled={busyUserId === p.userId}>
                    <Feather name="x" size={rf(14)} color={colors.onError} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statCell}><Text variant="label" color="textMuted">EARNINGS</Text><Text variant="h2" color="green">{sessionEarnings}</Text></View>
          <View style={styles.statCell}><Text variant="label" color="textMuted">PEAK</Text><Text variant="h2" color="textPrimary">{peak}</Text></View>
          <View style={styles.statCell}><Text variant="label" color="textMuted">IN ROOM</Text><Text variant="h2" color="textPrimary">{connected.length}</Text></View>
          <View style={styles.statCell}><Text variant="label" color="textMuted">GIFTS</Text><Text variant="h2" color="textPrimary">{sessionGifts}</Text></View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingEnd}
        icon="stop-circle"
        title="End group call?"
        message="The call will end for everyone. Participants are billed only for the time they spent."
        confirmLabel="End call"
        cancelLabel="Keep going"
        onConfirm={endCall}
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
  seats: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.chipSurface, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
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
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  stage: { aspectRatio: 16 / 11, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  stagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20 },
  quickControls: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', gap: spacing.xs },
  quickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.chipSurfaceStrong, alignItems: 'center', justifyContent: 'center' },
  endShow: { height: 48, borderRadius: radius.pill, overflow: 'hidden' },
  endShowFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  endShowText: { fontFamily: fontFamily.extrabold, fontSize: rf(13), letterSpacing: 0.3, color: colors.white },
  manageToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  manageToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  manageToggleRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pendingPill: { backgroundColor: colors.error, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  manageBody: { gap: spacing.sm },
  deliveryCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 6 },
  deliveryRowText: { flex: 1 },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  panel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, overflow: 'hidden' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.sm + 2 },
  tabActive: { backgroundColor: colors.pinkSoft },
  reqDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pink },
  feed: { height: wp(64) },
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
  list: { padding: spacing.sm, gap: spacing.sm },
  listEmpty: { padding: spacing.md },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  personName: { flex: 1, minWidth: 0 },
  roundIcon: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  kick: { backgroundColor: colors.redSoft },
  approveBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  statsBar: { flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.md },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
});

export default GroupCallRoomScreen;
