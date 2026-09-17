import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import {
  ActivityRow,
  RoomPanel,
  RoundChip,
  StageControls,
  live,
} from '@components/live';
import { BottomSheet, ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import {
  funWheelSpinsApi,
  rewardOrdersApi,
  type FunWheelSpinOrder,
  type RewardOrder,
} from '@services/api/liveDeliveryApi';
import { privateCallApi } from '@services/api/privateCallApi';
import { activePrivateCallStore } from '@services/privateCall/activePrivateCall';
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
import type { BroadcastActivityItem } from '@app-types/broadcast';
import type { PrivateCallConnectionResponse } from '@app-types/privateCall';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';
import { showToast } from '@utils/toast';

const formatElapsed = (t: number) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const HEARTBEAT_MS = 15000;
const DELIVERIES_POLL_MS = 12000;
/** Backstop for a missed PrivateCallEnded / PrivateCallStarted — same 3s as the web. */
const ACTIVE_POLL_MS = 3000;

/**
 * Private (1:1) call studio.
 *
 * Behaviour mirrors the artist web's PrivateCallActiveScreen — same
 * `/hubs/private-call` events, the same Agora join, per-minute cost pushes,
 * reward / fun-wheel fulfilment and the 3s active-session backstop.
 *
 * The chrome is the Live Broadcast studio's: the same stage, quick controls,
 * fullscreen pill, slide-in panel, round action bar and bottom sheets.
 */
const PrivateCallRoomScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    connection?: string;
    fanName?: string;
    ratePerMin?: string;
  }>();

  const connection = (() => {
    try {
      return params.connection
        ? (JSON.parse(params.connection) as PrivateCallConnectionResponse)
        : null;
    } catch {
      return null;
    }
  })();
  // Seeded from the params when a request was just accepted; refilled from the
  // stored record when the artist walks back into a call already in progress.
  const [fanName, setFanName] = useState(params.fanName || 'Fan');
  const [ratePerMin, setRatePerMin] = useState(Number(params.ratePerMin) || 0);

  const [status, setStatus] = useState<'connecting' | 'connected'>(
    'connecting',
  );
  const [elapsed, setElapsed] = useState(0);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);
  const [remoteAudioOn, setRemoteAudioOn] = useState(true);
  const [cost, setCost] = useState<{ minute: number; total: number }>({
    minute: 0,
    total: 0,
  });
  const [activity, setActivity] = useState<BroadcastActivityItem[]>([]);
  const [pendingRewards, setPendingRewards] = useState<RewardOrder[]>([]);
  const [pendingSpins, setPendingSpins] = useState<FunWheelSpinOrder[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [videoKey, setVideoKey] = useState(0);
  const [panel, setPanel] = useState<'activity' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [peerReconnecting, setPeerReconnecting] = useState(false);
  /** The artist's OWN link dropped — the backend is told so billing pauses. */
  const [selfReconnecting, setSelfReconnecting] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endingNotice, setEndingNotice] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const idRef = useRef<string | null>(connection?.privateCallId ?? null);
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const connectedRef = useRef(false);
  /** Presence/realtime (hub + heartbeat + delivery poll) started once, on mount. */
  const presenceStartedRef = useRef(false);
  const lostReportedRef = useRef(false);
  const feedRef = useRef<ScrollView>(null);
  const videoAvailable = isAgoraAvailable();

  const exitBack = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/calls/private-calls');
  }, [router]);

  /** Newest last, de-duplicated by id — same ordering as the broadcast feed. */
  const mergeActivity = useCallback((incoming: BroadcastActivityItem[]) => {
    setActivity((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i] as const));
      for (const item of incoming) byId.set(item.id, item);
      return Array.from(byId.values()).sort(
        (a, b) =>
          new Date(a.createdAtUtc).getTime() -
          new Date(b.createdAtUtc).getTime(),
      );
    });
  }, []);

  // Backstop for anything bought before the hub finished joining the call
  // group; live pushes cover everything from that point on.
  const refreshDeliveries = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    rewardOrdersApi.list('pending', 100, id).then((r) => {
      if (!r.success) return;
      setPendingRewards(r.data);
      mergeActivity(
        r.data.map((o) => ({
          type: 'reward',
          id: o.id,
          userId: o.userId,
          isArtist: false,
          displayName: o.buyerDisplayName || 'Fan',
          avatarUrl: null,
          text: null,
          extra: o.rewardName,
          iconUrl: null,
          priceCharged: o.priceCharged,
          status: o.status,
          createdAtUtc: o.createdAtUtc,
        })),
      );
    });
    funWheelSpinsApi.list('pending', 100, id).then((r) => {
      if (!r.success) return;
      setPendingSpins(r.data);
      mergeActivity(
        r.data.map((s) => ({
          type: 'fun_wheel',
          id: s.id,
          userId: s.userId,
          isArtist: false,
          displayName: s.buyerDisplayName || 'Fan',
          avatarUrl: null,
          text: null,
          extra: s.activityName,
          iconUrl: null,
          priceCharged: s.priceCharged,
          status: s.status,
          createdAtUtc: s.createdAtUtc,
        })),
      );
    });
  }, [mergeActivity]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let elapsedTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let delivTimer: ReturnType<typeof setInterval> | null = null;
    let activeTimer: ReturnType<typeof setInterval> | null = null;
    let rebindTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      await requestCallPermissions();
      // Kick the camera pipeline off up front so the stage has something to
      // bind to the moment it mounts.
      if (videoAvailable) startLocalPreview();

      /*
       * Entered from accepting a request, the connection arrives in the params.
       * Entered any other way — the artist backed out mid-call and came back —
       * there is none, so pick the call up from the stored record and ask the
       * backend for a fresh publisher token for that same call.
       */
      let conn = connection;
      if (conn) {
        // Fresh accept: mark the call active and refresh the Agora token, exactly
        // like the web does on every entry. This `connect()` is what flips the
        // call to "active" for the fan — without it the fan sees "this call isn't
        // active" and can't send rewards or spin the wheel. It's idempotent, so
        // calling it right after Accept is safe.
        const marked = await privateCallApi.connect(conn.privateCallId);
        if (marked.success) conn = marked.data;
      } else {
        const active = await activePrivateCallStore.get();
        if (active) {
          const again = await privateCallApi.connect(active.privateCallId);
          if (again.success) {
            conn = again.data;
            setFanName(active.fanName);
            setRatePerMin(active.ratePerMin);
            setElapsed(Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000)));
            showToast('Rejoined your call.', 'success');
          } else {
            // Ended while they were away — drop the stale record.
            await activePrivateCallStore.clear();
          }
        }
      }
      if (!conn || endedRef.current) {
        if (!endedRef.current) {
          showToast('That call is no longer active.', 'error');
          exitBack();
        }
        return;
      }
      idRef.current = conn.privateCallId;
      await activePrivateCallStore.save(conn, {
        fanName: params.fanName || fanName,
        ratePerMin: Number(params.ratePerMin) || ratePerMin,
      });

      // Video-connected UI only. The fan can already send rewards / spin the
      // wheel before this fires — that path runs in `startRealtime` below.
      const onConnected = () => {
        if (connectedRef.current || endedRef.current) return;
        connectedRef.current = true;
        setStatus('connected');
        setVideoKey((k) => k + 1);
        rebindTimer = setTimeout(() => setVideoKey((k) => k + 1), 1200);
        elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
      };

      // Presence + realtime — hub group-join, heartbeat, and the delivery-poll
      // backstop. Started immediately on mount, independent of the Agora video
      // join (mirrors the web). Gating this on the video channel is exactly why
      // the app artist was receiving no gifts / fun-wheel spins.
      const startRealtime = () => {
        if (presenceStartedRef.current || endedRef.current) return;
        presenceStartedRef.current = true;

        heartbeatTimer = setInterval(
          () => privateCallApi.heartbeat(conn.privateCallId),
          HEARTBEAT_MS,
        );
        delivTimer = setInterval(refreshDeliveries, DELIVERIES_POLL_MS);
        refreshDeliveries();

        privateCallHub.connect(conn.privateCallId, {
          onCallStarted: () => setStatus('connected'),
          onCallCostUpdate: (p) =>
            setCost({ minute: p.minuteNumber, total: p.totalCoinsCharged }),
          onRewardPurchased: (p) => {
            setPendingRewards((prev) =>
              prev.some((o) => o.id === p.id)
                ? prev
                : [
                    {
                      id: p.id,
                      broadcastId: conn.privateCallId,
                      userId: p.userId,
                      buyerDisplayName: p.displayName,
                      rewardName: p.rewardName,
                      priceCharged: p.priceCharged,
                      status: 'pending',
                      createdAtUtc: p.createdAtUtc,
                      updatedAtUtc: p.createdAtUtc,
                    },
                    ...prev,
                  ],
            );
            mergeActivity([
              {
                type: 'reward',
                id: p.id,
                userId: p.userId,
                isArtist: false,
                displayName: p.displayName,
                avatarUrl: p.avatarUrl,
                text: null,
                extra: p.rewardName,
                iconUrl: null,
                priceCharged: p.priceCharged,
                status: 'pending',
                createdAtUtc: p.createdAtUtc,
              },
            ]);
            showToast(
              `${p.displayName} sent "${p.rewardName}" for ${p.priceCharged} coins!`,
              'success',
            );
          },
          onFunWheelSpun: (p) => {
            setPendingSpins((prev) =>
              prev.some((s) => s.id === p.id)
                ? prev
                : [
                    {
                      id: p.id,
                      sessionType: 'private_call',
                      sessionId: conn.privateCallId,
                      userId: p.userId,
                      buyerDisplayName: p.displayName,
                      activityName: p.activityName,
                      priceCharged: p.priceCharged,
                      status: 'pending',
                      createdAtUtc: p.createdAtUtc,
                      updatedAtUtc: p.createdAtUtc,
                    },
                    ...prev,
                  ],
            );
            mergeActivity([
              {
                type: 'fun_wheel',
                id: p.id,
                userId: p.userId,
                isArtist: false,
                displayName: p.displayName,
                avatarUrl: p.avatarUrl,
                text: null,
                extra: p.activityName,
                iconUrl: null,
                priceCharged: p.priceCharged,
                status: 'pending',
                createdAtUtc: p.createdAtUtc,
              },
            ]);
            showToast(
              `${p.displayName} spun the wheel and won "${p.activityName}"!`,
              'success',
            );
          },
          onFulfillmentUpdated: (p) => {
            setActivity((prev) =>
              prev.map((it) =>
                it.id === p.id ? { ...it, status: p.status } : it,
              ),
            );
            refreshDeliveries();
          },
          onUserReconnecting: () => setPeerReconnecting(true),
          onUserReconnected: () => setPeerReconnecting(false),
          onCallEnding: (reason) => {
            if (reason === 'insufficient_balance')
              setEndingNotice('Call ending — insufficient balance.');
          },
          onPrivateCallEnded: () => {
            activePrivateCallStore.clear();
            exitBack();
          },
        });

        // The backend releases the artist's availability claim the moment a
        // call ends, so this catches a PrivateCallEnded we never received.
        activeTimer = setInterval(() => {
          privateCallApi.getActive().then((r) => {
            if (!r.success || endedRef.current) return;
            if (!r.data.hasActiveSession) {
              activePrivateCallStore.clear();
              exitBack();
            }
            else if (r.data.status === 'active') setStatus('connected');
          });
        }, ACTIVE_POLL_MS);
      };

      // Mark the call live and open the reward / fun-wheel pushes right away —
      // never wait on the video channel for this.
      startRealtime();

      if (videoAvailable) {
        joinPrivateCallChannel(
          conn.agoraChannelName,
          conn.agoraUid,
          conn.agoraToken,
          {
            onJoinSuccess: onConnected,
            onRemoteUserJoined: (uid) => {
              setRemoteUid(uid);
              setPeerReconnecting(false);
            },
            onRemoteUserLeft: () => setRemoteUid(null),
            onRemoteVideoOn: (_uid, on) => setRemoteVideoOn(on),
            onRemoteAudioOn: (_uid, on) => setRemoteAudioOn(on),
            /*
             * Our own link dropped. The backend needs telling — that is what
             * starts its grace period and stops the fan being billed for time
             * the artist isn't actually present.
             */
            onConnectionStateChanged: (state) => {
              if (endedRef.current) return;
              if (state === 'Reconnecting' || state === 'Failed') {
                setSelfReconnecting(true);
                const id = idRef.current;
                if (id && !lostReportedRef.current) {
                  lostReportedRef.current = true;
                  privateCallApi.reportConnectionLost(id);
                }
              } else if (state === 'Connected') {
                setSelfReconnecting(false);
                lostReportedRef.current = false;
              }
            },
            onError: (msg) => setErrorBanner(msg),
          },
        );
        // Same guard the broadcast studio uses: never leave the artist stuck
        // on "connecting" if the join callback never lands.
        setTimeout(() => {
          if (!endedRef.current) onConnected();
        }, 4000);
      } else {
        onConnected();
      }
    })();

    return () => {
      endedRef.current = true;
      [elapsedTimer, heartbeatTimer, delivTimer, activeTimer].forEach(
        (t) => t && clearInterval(t),
      );
      if (rebindTimer) clearTimeout(rebindTimer);
      privateCallHub.disconnect();
      destroyAgoraEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = async () => {
    setConfirmingEnd(false);
    setEnding(true);
    const id = idRef.current;
    // Same reason string the web sends, so history reads "Ended normally".
    if (id) await privateCallApi.end(id, 'artist_ended');
    // Only a real end clears this — backing out leaves the call running so the
    // artist can walk back in.
    await activePrivateCallStore.clear();
    setEnding(false);
    exitBack();
  };

  const fulfillReward = async (o: RewardOrder) => {
    setFulfillingId(o.id);
    const res = await rewardOrdersApi.fulfill(o.id);
    if (res.success) {
      setPendingRewards((prev) => prev.filter((x) => x.id !== o.id));
      setActivity((prev) =>
        prev.map((it) =>
          it.id === o.id ? { ...it, status: 'fulfilled' } : it,
        ),
      );
      showToast(
        `Marked "${o.rewardName}" as delivered to ${o.buyerDisplayName}.`,
        'success',
      );
    } else {
      showToast(res.error, 'error');
    }
    setFulfillingId(null);
  };

  const fulfillSpin = async (s: FunWheelSpinOrder) => {
    setFulfillingId(s.id);
    const res = await funWheelSpinsApi.fulfill(s.id);
    if (res.success) {
      setPendingSpins((prev) => prev.filter((x) => x.id !== s.id));
      setActivity((prev) =>
        prev.map((it) =>
          it.id === s.id ? { ...it, status: 'fulfilled' } : it,
        ),
      );
      showToast(
        `Marked "${s.activityName}" as delivered to ${s.buyerDisplayName}.`,
        'success',
      );
    } else {
      showToast(res.error, 'error');
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
      if (v === false) setVideoKey((k) => k + 1); // turning back on → rebind
      return !v;
    });

  const pendingCount = pendingRewards.length + pendingSpins.length;
  const connected = status === 'connected';
  const fanVideoLive = videoAvailable && remoteUid !== null && remoteVideoOn;

  const deliveryRows = (
    icon: 'gift' | 'star',
    title: string,
    count: number,
    rows: ReactNode,
  ) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHead}>
        <Feather name={icon} size={rf(16)} color={colors.gold} />
        <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
          {title}
          {count > 0 ? ` (${count} pending)` : ''}
        </Text>
      </View>
      {count === 0 ? (
        <Text variant="bodySm" color="textMuted">
          Nothing owed right now.
        </Text>
      ) : (
        rows
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header — LIVE / CONNECTING · fan · timer · earned */}
      {!isFullscreen ? (
        <View style={styles.header}>
          <View style={styles.headerCreator}>
            <View style={styles.headerNameRow}>
              <View
                style={[
                  styles.liveBadge,
                  !connected && styles.liveBadgeConnecting,
                ]}
              >
                {connected ? <View style={styles.liveBadgeDot} /> : null}
                <Text style={styles.liveBadgeText}>
                  {connected ? 'LIVE' : 'CONNECTING'}
                </Text>
              </View>
              <Text
                variant="bodyLg"
                color="textPrimary"
                numberOfLines={1}
                style={styles.headerName}
              >
                {fanName}
              </Text>
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>
              {ratePerMin > 0
                ? `Private call · ${ratePerMin} tk/min`
                : 'Private call'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerPill}>
              <Feather name="clock" size={rf(12)} color={colors.textPrimary} />
              <Text style={styles.headerPillText}>
                {formatElapsed(elapsed)}
              </Text>
            </View>
            <View style={styles.headerPill}>
              <Feather
                name="dollar-sign"
                size={rf(12)}
                color={colors.textPrimary}
              />
              <Text style={styles.headerPillText}>{cost.total}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {errorBanner && !isFullscreen ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={rf(13)} color={colors.onError} />
          <Text variant="caption" color="onError">
            {errorBanner}
          </Text>
        </View>
      ) : null}

      {endingNotice && !isFullscreen ? (
        <View style={styles.noticeBanner}>
          <Feather name="alert-circle" size={rf(13)} color={colors.warning} />
          <Text variant="caption" color="warning">
            {endingNotice}
          </Text>
        </View>
      ) : null}

      {peerReconnecting && !isFullscreen ? (
        <View style={styles.noticeBanner}>
          <Feather name="wifi-off" size={rf(13)} color={colors.warning} />
          <Text variant="caption" color="warning">
            {fanName}&apos;s connection dropped — reconnecting…
          </Text>
        </View>
      ) : null}

      {selfReconnecting && !isFullscreen ? (
        <View style={styles.noticeBanner}>
          <Feather name="wifi-off" size={rf(13)} color={colors.warning} />
          <Text variant="caption" color="warning">
            Your connection dropped — reconnecting. Billing is paused.
          </Text>
        </View>
      ) : null}

      {/* ── Video stage: the fan fills it, the artist sits in the PIP ── */}
      <View style={[styles.videoArea, isFullscreen && styles.videoAreaFull]}>
        {fanVideoLive ? (
          <AgoraVideoView
            uid={remoteUid as number}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.stagePlaceholder}>
            {connected && remoteUid !== null ? (
              <>
                <Feather
                  name="video-off"
                  size={rf(40)}
                  color={colors.textMuted}
                />
                <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
                  {fanName}&apos;s camera is off
                </Text>
                <Text variant="bodySm" color="textMuted">
                  You&apos;re still connected — audio keeps running.
                </Text>
              </>
            ) : (
              <>
                <Avatar
                  initials={fanName.slice(0, 1).toUpperCase()}
                  size="lg"
                />
                <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
                  {connected
                    ? `Waiting for ${fanName}…`
                    : 'Connecting your call…'}
                </Text>
                <Text variant="bodySm" color="textMuted" align="center">
                  {connected
                    ? 'Their video appears here the moment they join.'
                    : `Setting up the room — waiting for ${fanName} to connect on their end too.`}
                </Text>
              </>
            )}
          </View>
        )}

        <Pressable
          style={[styles.fsPill, isFullscreen && styles.fsPillFull]}
          onPress={() => setIsFullscreen((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Feather
            name={isFullscreen ? 'minimize-2' : 'maximize-2'}
            size={rf(13)}
            color={live.white}
          />
          <Text style={styles.fsPillText}>
            {isFullscreen ? 'Exit' : 'Full Screen'}
          </Text>
        </Pressable>

        <StageControls
          camOn={camOn}
          micOn={micOn}
          onToggleCam={toggleCam}
          onToggleMic={toggleMic}
          onFlipCamera={videoAvailable ? switchCamera : undefined}
          topOffset={isFullscreen ? 6 : undefined}
        />

        {/* Fan-state badge — the web's `pcall-corner-badges`. Only the mic
            needs one: a camera that's off is already what the stage says. */}
        <View style={styles.cornerBadges}>
          {!remoteAudioOn && remoteUid !== null ? (
            <View style={styles.cornerBadge}>
              <Feather
                name="mic-off"
                size={rf(12)}
                color={colors.textPrimary}
              />
              <Text style={styles.cornerBadgeText}>
                {fanName}&apos;s mic is off
              </Text>
            </View>
          ) : null}
        </View>

        {/* Local PIP */}
        <View style={styles.pip}>
          {videoAvailable && camOn ? (
            <AgoraVideoView
              key={videoKey}
              uid={0}
              style={StyleSheet.absoluteFill}
              overlay
            />
          ) : (
            <View style={styles.pipPlaceholder}>
              <Feather
                name="video-off"
                size={rf(18)}
                color={colors.textMuted}
              />
            </View>
          )}
        </View>
      </View>

      {/* ── Activity / Guest panel (opened from the round bar) ── */}
      {!isFullscreen && panel === 'activity' ? (
        <RoomPanel title="ACTIVITY" onClose={() => setPanel(null)}>
          <ScrollView
            ref={feedRef}
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              feedRef.current?.scrollToEnd({ animated: true })
            }
          >
            {activity.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="gift" size={rf(28)} color={colors.textMuted} />
                <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
                  Nothing yet
                </Text>
                <Text variant="bodySm" color="textMuted" align="center">
                  Rewards and fun-wheel prizes {fanName} buys during this call
                  show up here as they happen.
                </Text>
              </View>
            ) : (
              activity.map((item) => <ActivityRow key={item.id} item={item} />)
            )}
          </ScrollView>
        </RoomPanel>
      ) : null}

      {/* ── Round action bar ── */}
      {!isFullscreen ? (
        <View style={styles.roundBar}>
          <RoundChip
            variant="danger"
            icon="phone-off"
            label="End call"
            onPress={() => setConfirmingEnd(true)}
          />
          <RoundChip
            variant="neutral"
            icon="activity"
            label="Activity"
            onPress={() =>
              setPanel((p) => (p === 'activity' ? null : 'activity'))
            }
            active={panel === 'activity'}
          />
          <RoundChip
            variant="gift"
            icon="gift"
            label="Manage rewards"
            onPress={() => setManageOpen(true)}
            badge={pendingCount}
          />
        </View>
      ) : null}

      {/* Manage bottom sheet */}
      <BottomSheet
        visible={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage this call"
        snapPoints={[0.6]}
      >
        <View style={styles.sheetBody}>
          {deliveryRows(
            'gift',
            'Reward deliveries',
            pendingRewards.length,
            pendingRewards.map((o) => (
              <View key={o.id} style={styles.deliveryRow}>
                <Text
                  variant="caption"
                  color="textPrimary"
                  style={styles.deliveryRowText}
                >
                  <Text
                    variant="caption"
                    color="textPrimary"
                    style={styles.bold}
                  >
                    {o.rewardName}
                  </Text>{' '}
                  for {o.buyerDisplayName} · {o.priceCharged} tk
                </Text>
                <Pressable
                  style={styles.markBtn}
                  onPress={() => fulfillReward(o)}
                  disabled={fulfillingId === o.id}
                >
                  {fulfillingId === o.id ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Feather
                        name="check"
                        size={rf(13)}
                        color={colors.white}
                      />
                      <Text
                        variant="label"
                        color="onPrimary"
                        style={styles.bold}
                      >
                        Mark fulfilled
                      </Text>
                    </>
                  )}
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
                <Text
                  variant="caption"
                  color="textPrimary"
                  style={styles.deliveryRowText}
                >
                  <Text
                    variant="caption"
                    color="textPrimary"
                    style={styles.bold}
                  >
                    {s.activityName}
                  </Text>{' '}
                  for {s.buyerDisplayName} · {s.priceCharged} tk
                </Text>
                <Pressable
                  style={styles.markBtn}
                  onPress={() => fulfillSpin(s)}
                  disabled={fulfillingId === s.id}
                >
                  {fulfillingId === s.id ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Feather
                        name="check"
                        size={rf(13)}
                        color={colors.white}
                      />
                      <Text
                        variant="label"
                        color="onPrimary"
                        style={styles.bold}
                      >
                        Mark fulfilled
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )),
          )}
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmingEnd}
        title="End call?"
        message="The call ends for both of you and can't be resumed. The fan is billed only for the time used."
        confirmLabel={ending ? 'Ending…' : 'End call'}
        cancelLabel="Keep talking"
        tone="danger"
        onConfirm={endCall}
        onCancel={() => setConfirmingEnd(false)}
      />
    </SafeAreaView>
  );
};

/* Values are the Live Broadcast studio's — same header pills, stage frame,
 * panel, round bar and sheets, so the two rooms read as one product. */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bold: { fontFamily: fontFamily.bold },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerCreator: { flex: 1, minWidth: 0, gap: 3 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerName: { flexShrink: 1, fontFamily: fontFamily.bold },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: live.liveBadge,
  },
  liveBadgeConnecting: { backgroundColor: colors.warning },
  liveBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: live.white,
  },
  liveBadgeText: {
    fontFamily: fontFamily.extrabold,
    color: live.white,
    fontSize: rf(10.5),
    letterSpacing: 0.5,
  },
  headerSub: {
    flexShrink: 1,
    fontFamily: fontFamily.semibold,
    color: live.headerSub,
    fontSize: rf(12),
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: live.headerPill,
  },
  headerPillText: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    fontSize: rf(12),
  },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningChip,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },

  // Video stage
  videoArea: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: 22,
    backgroundColor: live.stageBg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: live.stageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoAreaFull: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  stagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  fsPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: live.overlayPill,
    borderWidth: 1,
    borderColor: live.overlayPillBorder,
  },
  /* Fullscreen sits inside the same SafeAreaView, so the status-bar inset is
     already paid for — the controls ride the very top edge of the stage. */
  fsPillFull: { top: 6 },
  fsPillText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    color: live.white,
  },
  cornerBadges: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    zIndex: 15,
    gap: 6,
    maxWidth: '58%',
  },
  cornerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: live.overlayPill,
    borderWidth: 1,
    borderColor: live.overlayPillBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cornerBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    color: colors.textPrimary,
  },
  pip: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 16,
    width: wp(24),
    height: wp(33),
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: live.stageBg,
    borderWidth: 1,
    borderColor: live.overlayPillBorder,
  },
  pipPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Panel body (the panel shell itself is @components/live's RoomPanel)
  feed: { flex: 1 },
  feedContent: { padding: spacing.sm, gap: spacing.sm },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xl,
  },

  // Round action bar
  roundBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: live.barFill,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Bottom sheets
  sheetBody: { gap: spacing.sm, paddingTop: spacing.sm },
  deliveryCard: {
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  deliveryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  deliveryRowText: { flex: 1 },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statsSheet: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
  },
  statIc: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});

export default PrivateCallRoomScreen;
