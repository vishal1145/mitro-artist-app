import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { funWheelSpinsApi, rewardOrdersApi, type FunWheelSpinOrder, type RewardOrder } from '@services/api/liveDeliveryApi';
import { privateCallApi } from '@services/api/privateCallApi';
import { privateCallHub } from '@services/realtime/privateCallHub';
import {
  destroyAgoraEngine,
  isAgoraAvailable,
  joinPrivateCallChannel,
  requestCallPermissions,
  setLocalAudioEnabled,
  setLocalVideoEnabled,
  startLocalPreview,
  switchCamera,
} from '@services/agora/agoraEngine';
import type { PrivateCallConnectionResponse } from '@app-types/privateCall';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

const formatElapsed = (t: number) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const HEARTBEAT_MS = 15000;
const DELIVERIES_POLL_MS = 12000;

const PrivateCallRoomScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ connection?: string; fanName?: string; ratePerMin?: string }>();

  const connection = (() => {
    try {
      return params.connection ? (JSON.parse(params.connection) as PrivateCallConnectionResponse) : null;
    } catch {
      return null;
    }
  })();
  const fanName = params.fanName || 'Fan';
  const ratePerMin = Number(params.ratePerMin) || 0;

  const [status, setStatus] = useState<'connecting' | 'connected'>('connecting');
  const [elapsed, setElapsed] = useState(0);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);
  const [cost, setCost] = useState<{ minute: number; total: number }>({ minute: 0, total: 0 });
  const [pendingRewards, setPendingRewards] = useState<RewardOrder[]>([]);
  const [pendingSpins, setPendingSpins] = useState<FunWheelSpinOrder[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [videoKey, setVideoKey] = useState(0);
  const [peerReconnecting, setPeerReconnecting] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const idRef = useRef<string | null>(connection?.privateCallId ?? null);
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const videoAvailable = isAgoraAvailable();

  const refreshDeliveries = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    rewardOrdersApi.list('pending', 100, id).then((r) => r.success && setPendingRewards(r.data));
    funWheelSpinsApi.list('pending', 100, id).then((r) => r.success && setPendingSpins(r.data));
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!connection) {
      setErrorBanner('Missing call connection.');
      Alert.alert('Call error', 'Missing call connection.', [{ text: 'OK', onPress: () => exitBack() }]);
      return;
    }

    let elapsedTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let delivTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      await requestCallPermissions();
      if (videoAvailable) startLocalPreview();

      const onConnected = () => {
        setStatus('connected');
        setVideoKey((k) => k + 1);
        setTimeout(() => setVideoKey((k) => k + 1), 1200);
        elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
        heartbeatTimer = setInterval(() => privateCallApi.heartbeat(connection.privateCallId), HEARTBEAT_MS);
        delivTimer = setInterval(refreshDeliveries, DELIVERIES_POLL_MS);
        refreshDeliveries();
        privateCallHub.connect(connection.privateCallId, {
          onCallCostUpdate: (p) => setCost({ minute: p.minuteNumber, total: p.totalCoinsCharged }),
          onRewardPurchased: refreshDeliveries,
          onFunWheelSpun: refreshDeliveries,
          onFulfillmentUpdated: refreshDeliveries,
          onUserReconnecting: () => setPeerReconnecting(true),
          onUserReconnected: () => setPeerReconnecting(false),
          onPrivateCallEnded: () => exitBack(),
        });
      };

      if (videoAvailable) {
        joinPrivateCallChannel(connection.agoraChannelName, connection.agoraUid, connection.agoraToken, {
          onJoinSuccess: onConnected,
          onRemoteUserJoined: (uid) => {
            setRemoteUid(uid);
            setPeerReconnecting(false);
          },
          onRemoteUserLeft: () => setRemoteUid(null),
          onRemoteVideoOn: (_uid, on) => setRemoteVideoOn(on),
          onError: (msg) => setErrorBanner(msg),
        });
        setTimeout(() => {
          if (!endedRef.current && status === 'connecting') onConnected();
        }, 4000);
      } else {
        onConnected();
      }
    })();

    return () => {
      endedRef.current = true;
      [elapsedTimer, heartbeatTimer, delivTimer].forEach((t) => t && clearInterval(t));
      privateCallHub.disconnect();
      destroyAgoraEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/calls/private-calls');
  };

  const endCall = async () => {
    setConfirmingEnd(false);
    const id = idRef.current;
    if (id) await privateCallApi.end(id);
    exitBack();
  };

  const fulfillReward = async (o: RewardOrder) => {
    setFulfillingId(o.id);
    const res = await rewardOrdersApi.fulfill(o.id);
    if (res.success) setPendingRewards((prev) => prev.filter((x) => x.id !== o.id));
    setFulfillingId(null);
  };
  const fulfillSpin = async (s: FunWheelSpinOrder) => {
    setFulfillingId(s.id);
    const res = await funWheelSpinsApi.fulfill(s.id);
    if (res.success) setPendingSpins((prev) => prev.filter((x) => x.id !== s.id));
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

  const pendingCount = pendingRewards.length + pendingSpins.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Feather name="phone" size={rf(14)} color={colors.pink} />
          <Text variant="h2" color="textPrimary" numberOfLines={1} style={styles.title}>{fanName}</Text>
        </View>
        <View style={styles.studioStats}>
          <View style={[styles.livePill, status !== 'connected' && styles.livePillStarting]}>
            {status === 'connected' ? <View style={styles.liveDot} /> : null}
            <Text variant="label" color="onError">{status === 'connected' ? 'LIVE' : 'CONNECTING'}</Text>
          </View>
          <View style={styles.statChip}>
            <Feather name="clock" size={rf(12)} color={colors.textPrimary} />
            <Text variant="label" color="textPrimary">{formatElapsed(elapsed)}</Text>
          </View>
        </View>
      </View>

      {/* Progress banner */}
      <View style={styles.progressBanner}>
        <View style={styles.progressSegs}>{[0, 1, 2, 3].map((i) => (<View key={i} style={[styles.seg, i < 3 && styles.segFilled]} />))}</View>
        <Text variant="bodySm" color="textSecondary" style={styles.progressText}>
          {status === 'connected' ? (
            <>You&apos;re connected! Reward and fun-wheel activity is below — hit <Text variant="bodySm" color="textPrimary" style={styles.bold}>End Call</Text> whenever you&apos;re ready to wrap up.</>
          ) : (
            <>Connecting your call… waiting for {fanName} to connect on their end too.</>
          )}
        </Text>
      </View>

      {errorBanner ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={rf(13)} color={colors.onError} />
          <Text variant="caption" color="onError">{errorBanner}</Text>
        </View>
      ) : null}
      {peerReconnecting ? (
        <View style={styles.reconnectBanner}>
          <Feather name="wifi-off" size={rf(13)} color={colors.warning} />
          <Text variant="caption" color="warning">{fanName}&apos;s connection dropped — reconnecting…</Text>
        </View>
      ) : null}

      {/* Stage: fan (remote) big + self (local) PIP */}
      <View style={styles.stageWrap}>
        <View style={styles.stage}>
          {videoAvailable && remoteUid && remoteVideoOn ? (
            <AgoraVideoView uid={remoteUid} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.stagePlaceholder}>
              <Avatar initials={fanName.slice(0, 1).toUpperCase()} size="lg" />
              <Text variant="bodySm" color="textMuted">
                {remoteUid ? `${fanName}'s camera is off` : `Waiting for ${fanName}'s camera…`}
              </Text>
            </View>
          )}

          {/* Local PIP */}
          <View style={styles.pip}>
            {videoAvailable && camOn ? (
              <AgoraVideoView key={videoKey} uid={0} style={StyleSheet.absoluteFill} overlay />
            ) : (
              <View style={styles.pipPlaceholder}>
                <Feather name="video-off" size={rf(16)} color={colors.textMuted} />
              </View>
            )}
          </View>

          {/* Quick controls */}
          <View style={styles.quickControls}>
            <Pressable style={styles.quickBtn} onPress={toggleCam}><Feather name={camOn ? 'video' : 'video-off'} size={rf(16)} color={colors.textPrimary} /></Pressable>
            <Pressable style={styles.quickBtn} onPress={toggleMic}><Feather name={micOn ? 'mic' : 'mic-off'} size={rf(16)} color={colors.textPrimary} /></Pressable>
            {videoAvailable ? <Pressable style={styles.quickBtn} onPress={switchCamera}><Feather name="refresh-cw" size={rf(16)} color={colors.textPrimary} /></Pressable> : null}
          </View>
        </View>
      </View>

      {/* End Call */}
      <View style={styles.controlsRow}>
        <Pressable style={styles.endShow} onPress={() => setConfirmingEnd(true)}>
          <LinearGradient colors={['#FF5C7A', '#FF3FAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.endShowFill}>
            <Feather name="phone-off" size={rf(15)} color={colors.white} />
            <Text style={styles.endShowText}>End Call</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Rewards & prizes + stats */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryHead}>
            <Feather name="gift" size={rf(16)} color={colors.gold} />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>Reward deliveries{pendingRewards.length > 0 ? ` (${pendingRewards.length} pending)` : ''}</Text>
          </View>
          {pendingRewards.length === 0 ? (
            <Text variant="bodySm" color="textMuted">Nothing owed right now.</Text>
          ) : pendingRewards.map((o) => (
            <View key={o.id} style={styles.deliveryRow}>
              <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}><Text variant="caption" style={styles.bold} color="textPrimary">{o.rewardName}</Text> for {o.buyerDisplayName} · {o.priceCharged} tk</Text>
              <Pressable style={styles.markBtn} onPress={() => fulfillReward(o)} disabled={fulfillingId === o.id}>
                {fulfillingId === o.id ? <ActivityIndicator size="small" color={colors.white} /> : (<><Feather name="check" size={rf(13)} color={colors.white} /><Text variant="label" color="onPrimary" style={styles.bold}>Mark fulfilled</Text></>)}
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.deliveryCard}>
          <View style={styles.deliveryHead}>
            <Feather name="star" size={rf(16)} color={colors.gold} />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>Fun-wheel prizes{pendingSpins.length > 0 ? ` (${pendingSpins.length} pending)` : ''}</Text>
          </View>
          {pendingSpins.length === 0 ? (
            <Text variant="bodySm" color="textMuted">Nothing owed right now.</Text>
          ) : pendingSpins.map((s) => (
            <View key={s.id} style={styles.deliveryRow}>
              <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}><Text variant="caption" style={styles.bold} color="textPrimary">{s.activityName}</Text> for {s.buyerDisplayName} · {s.priceCharged} tk</Text>
              <Pressable style={styles.markBtn} onPress={() => fulfillSpin(s)} disabled={fulfillingId === s.id}>
                {fulfillingId === s.id ? <ActivityIndicator size="small" color={colors.white} /> : (<><Feather name="check" size={rf(13)} color={colors.white} /><Text variant="label" color="onPrimary" style={styles.bold}>Mark fulfilled</Text></>)}
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statCell}><Text variant="label" color="textMuted">EARNED</Text><Text variant="h3" color="green">{cost.total}</Text></View>
          <View style={styles.statCell}><Text variant="label" color="textMuted">MINUTE</Text><Text variant="h3" color="textPrimary">{cost.minute}</Text></View>
          <View style={styles.statCell}><Text variant="label" color="textMuted">RATE</Text><Text variant="h3" color="textPrimary">{ratePerMin}</Text></View>
          <View style={styles.statCell}><Text variant="label" color="textMuted">PENDING</Text><Text variant="h3" color="textPrimary">{pendingCount}</Text></View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingEnd}
        icon="phone-off"
        title="End call?"
        message="The call will end for both of you. The fan is billed only for the time used."
        confirmLabel="End call"
        cancelLabel="Keep talking"
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
  reconnectBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.warningChip, marginHorizontal: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },
  stageWrap: { flex: 1, paddingHorizontal: spacing.md },
  stage: { flex: 1, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  stagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  pip: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, width: wp(26), height: wp(36), borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border },
  pipPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickControls: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', gap: spacing.xs },
  quickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.chipSurfaceStrong, alignItems: 'center', justifyContent: 'center' },
  controlsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  endShow: { height: 46, borderRadius: radius.pill, overflow: 'hidden' },
  endShowFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  endShowText: { fontFamily: fontFamily.extrabold, fontSize: rf(13), letterSpacing: 0.3, color: colors.white },
  body: { flex: 0, maxHeight: wp(70) },
  bodyContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  deliveryCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 6 },
  deliveryRowText: { flex: 1 },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  statsBar: { flexDirection: 'row', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.sm },
  statCell: { flex: 1, alignItems: 'center', gap: 1 },
});

export default PrivateCallRoomScreen;
