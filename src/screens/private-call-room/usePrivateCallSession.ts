import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

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
} from '@services/agora/agoraEngine';
import type { BroadcastActivityItem } from '@app-types/broadcast';
import type { PrivateCallConnectionResponse } from '@app-types/privateCall';
import { showToast } from '@utils/toast';

import type { UsePrivateCallSessionResult } from './usePrivateCallSession.types';

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
 * All private-call-room logic. The screen component renders state; it holds
 * none. This studio is intentionally NOT sharing a "room session" hook with
 * the broadcast/group-call rooms — its remote-peer/PIP video model is
 * genuinely different.
 */
export const usePrivateCallSession = (): UsePrivateCallSessionResult => {
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

  return {
    fanName,
    ratePerMin,
    status,
    elapsed,
    remoteUid,
    remoteVideoOn,
    remoteAudioOn,
    cost,
    activity,
    pendingRewards,
    pendingSpins,
    fulfillingId,
    micOn,
    camOn,
    videoKey,
    panel,
    isFullscreen,
    manageOpen,
    peerReconnecting,
    selfReconnecting,
    confirmingEnd,
    ending,
    endingNotice,
    errorBanner,
    videoAvailable,
    pendingCount,
    connected,
    fanVideoLive,
    feedRef,
    setPanel,
    setIsFullscreen,
    setManageOpen,
    setConfirmingEnd,
    endCall,
    fulfillReward,
    fulfillSpin,
    toggleMic,
    toggleCam,
  };
};
