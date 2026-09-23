import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

import { groupCallApi } from '@services/api/groupCallApi';
import { funWheelSpinsApi, rewardOrdersApi, type FunWheelSpinOrder, type RewardOrder } from '@services/api/liveDeliveryApi';
import { activeGroupCallStore, type GroupCallDraft } from '@services/groupCall/activeGroupCall';
import { groupCallHub } from '@services/realtime/groupCallHub';
import {
  destroyAgoraEngine,
  isAgoraAvailable,
  joinAsHost,
  requestCallPermissions,
  setLocalAudioEnabled,
  setLocalVideoEnabled,
  startLocalPreview,
} from '@services/agora/agoraEngine';
import type {
  GroupCallActivityItem,
  GroupCallConnectionResponse,
} from '@app-types/groupCall';
import { showToast } from '@utils/toast';

import { CONNECTED, useParticipants } from './useParticipants';
import type { UseGroupCallSessionResult } from './useGroupCallSession.types';

const ACTIVITY_POLL_MS = 15000;
const PARTICIPANT_POLL_MS = 6000;
const DELIVERIES_POLL_MS = 12000;
const HEARTBEAT_MS = 15000;

/** All group-call-room logic. The screen component renders state; it holds none. */
export const useGroupCallSession = (): UseGroupCallSessionResult => {
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
  // Seeded from the params for a fresh room; overwritten from the stored
  // record when we rejoin a call the artist walked out of (no params then).
  const [displayTitle, setDisplayTitle] = useState((config.title || 'Group Call').trim());
  const [maxParticipants, setMaxParticipants] = useState(config.maxParticipants ?? 8);
  const [isAudioOnly, setIsAudioOnly] = useState(config.mode === 'audio');

  const [status, setStatus] = useState<'starting' | 'live'>('starting');
  const [elapsed, setElapsed] = useState(0);
  const [activity, setActivity] = useState<GroupCallActivityItem[]>([]);
  const [pendingRewards, setPendingRewards] = useState<RewardOrder[]>([]);
  const [pendingSpins, setPendingSpins] = useState<FunWheelSpinOrder[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [peak, setPeak] = useState(0);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!isAudioOnly);
  const [videoKey, setVideoKey] = useState(0);
  const [panel, setPanel] = useState<'chat' | 'participants' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  /** OFFLINE gate — the room exists but hasn't been opened yet. */
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [startingRoom, setStartingRoom] = useState(false);

  const idRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const liveStartedRef = useRef(false);
  const endedRef = useRef(false);
  const chatRef = useRef<ScrollView>(null);
  const confirmResolveRef = useRef<(() => void) | null>(null);
  const videoAvailable = isAgoraAvailable();

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

  const {
    participants,
    setParticipants,
    pending,
    connected,
    busyUserId,
    approve,
    reject,
    remove,
    toggleMute,
  } = useParticipants(() => idRef.current, refreshParticipants);

  const sessionEarnings = activity.reduce((sum, i) => sum + (i.priceCharged || 0), 0);
  const sessionGifts = activity.filter((i) => i.type === 'reward').length;
  const pendingCount = pendingRewards.length + pendingSpins.length;

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

  const refreshDeliveries = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    rewardOrdersApi.list('pending', 100, id).then((r) => r.success && setPendingRewards(r.data));
    funWheelSpinsApi.list('pending', 100, id).then((r) => r.success && setPendingSpins(r.data));
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let elapsedTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let actTimer: ReturnType<typeof setInterval> | null = null;
    let partTimer: ReturnType<typeof setInterval> | null = null;
    let delivTimer: ReturnType<typeof setInterval> | null = null;

    const bail = (message: string) => {
      showToast(message, 'error');
      router.back();
    };

    (async () => {
      await requestCallPermissions();

      // Resume a call the artist backed out of without ending it — the same
      // rejoin-first flow the broadcast studio uses. The room keeps running
      // server-side while they're away; only if there is nothing to resume do
      // we create/start a fresh one.
      let conn: GroupCallConnectionResponse | null = null;
      let draft: GroupCallDraft | null = null;

      const active = await activeGroupCallStore.get();
      if (active) {
        const rj = await groupCallApi.rejoin(active.groupCallId);
        if (rj.success) {
          conn = rj.data;
          idRef.current = active.groupCallId;
          draft = {
            groupCallId: active.groupCallId,
            title: active.title,
            maxParticipants: active.maxParticipants,
            entryPrice: active.entryPrice,
            requiresApproval: active.requiresApproval,
            audioOrVideoMode: active.audioOrVideoMode,
          };
          setDisplayTitle(active.title);
          setMaxParticipants(active.maxParticipants);
          setIsAudioOnly(active.audioOrVideoMode === 'audio');
          if (active.audioOrVideoMode === 'audio') setCamOn(false);
          if (active.startedAt) {
            setElapsed(Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000)));
          }
          showToast('Rejoined your group call.', 'success');
        } else {
          // Ended or cancelled elsewhere — drop the stale record so the artist
          // can create a new call instead of being stuck on a dead one.
          await activeGroupCallStore.clear();
        }
      }

      if (!conn) {
        let groupCallId = existingId ?? null;
        const spec = {
          title: (config.title || 'Group Call').trim(),
          maxParticipants: config.maxParticipants ?? 8,
          entryPrice: config.entryPrice ?? 0,
          requiresApproval: config.requiresApproval ?? true,
          audioOrVideoMode: (config.mode ?? 'video') as 'audio' | 'video',
        };
        if (!groupCallId) {
          const createRes = await groupCallApi.create(spec);
          if (!createRes.success) return bail(createRes.error);
          groupCallId = createRes.data.groupCallId;
        }
        idRef.current = groupCallId;
        draft = { groupCallId, ...spec };
        await activeGroupCallStore.saveDraft(draft);

        // Preview the camera, then wait on the START CALL gate — the room is
        // created but nobody can join until the artist actually opens it.
        if (videoAvailable && spec.audioOrVideoMode !== 'audio') startLocalPreview();
        setAwaitingConfirm(true);
        await new Promise<void>((resolve) => {
          confirmResolveRef.current = resolve;
        });
        confirmResolveRef.current = null;
        if (endedRef.current) return; // cancelled / left the gate
        setAwaitingConfirm(false);

        const startRes = await groupCallApi.start(groupCallId);
        if (!startRes.success) {
          setStartingRoom(false);
          await activeGroupCallStore.clear();
          return bail(startRes.error);
        }
        conn = startRes.data;
      }

      const groupCallId = idRef.current!;
      const audioOnly = draft!.audioOrVideoMode === 'audio';
      // Remember the channel details, so a second walk-out still resumes.
      await activeGroupCallStore.saveConnection(conn, draft!);
      if (videoAvailable && !audioOnly) startLocalPreview();

      const { agoraChannelName, agoraUid, agoraToken } = conn;

      const goLive = () => {
        if (liveStartedRef.current || endedRef.current) return;
        liveStartedRef.current = true;
        setStatus('live');
        setVideoKey((k) => k + 1);
        setTimeout(() => setVideoKey((k) => k + 1), 1200);
        groupCallApi.confirmConnected(groupCallId);
        elapsedTimer = setInterval(() => setElapsed((s) => s + 1), 1000);
        heartbeatTimer = setInterval(() => groupCallApi.heartbeat(groupCallId), HEARTBEAT_MS);
        actTimer = setInterval(refreshActivity, ACTIVITY_POLL_MS);
        partTimer = setInterval(refreshParticipants, PARTICIPANT_POLL_MS);
        delivTimer = setInterval(refreshDeliveries, DELIVERIES_POLL_MS);
        refreshActivity();
        refreshParticipants();
        refreshDeliveries();
        groupCallHub.connect(groupCallId, {
          onActivityAdded: (item) => mergeActivity([item]),
          onParticipantRequested: () => {
            refreshParticipants();
            // The approve action lives inside the Participants panel, so say
            // so — otherwise a fan sits in the queue unnoticed.
            showToast('Someone wants to join — open Participants to approve.', 'info');
          },
          onParticipantsChanged: () => refreshParticipants(),
          onParticipantStatusChanged: () => refreshParticipants(),
          onFulfillmentUpdated: (p) => {
            setActivity((prev) => prev.map((it) => (it.id === p.id ? { ...it, status: p.status } : it)));
            refreshDeliveries();
          },
          onGroupCallEnded: () => {
            activeGroupCallStore.clear();
            exitBack();
          },
        });
      };

      if (videoAvailable && !audioOnly) {
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
      confirmResolveRef.current?.(); // unblock the gate if it's still waiting
      [elapsedTimer, heartbeatTimer, actTimer, partTimer, delivTimer].forEach((t) => t && clearInterval(t));
      groupCallHub.disconnect();
      destroyAgoraEngine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/calls');
  };

  /**
   * Backing out of the OFFLINE gate. The room was already created (by the
   * schedule form) but never opened, so cancel it rather than leaving a draft
   * the artist would be locked behind next time.
   */
  const abandonBeforeStart = async () => {
    if (startingRoom) return;
    endedRef.current = true;
    confirmResolveRef.current?.();
    const id = idRef.current;
    if (id) await groupCallApi.cancel(id, 'Artist left before starting');
    await activeGroupCallStore.clear();
    exitBack();
  };

  const endCall = async () => {
    if (isEnding) return; // already ending — ignore repeat taps
    setIsEnding(true);
    const id = idRef.current;
    if (id) await groupCallApi.end(id);
    // Only an actual End clears this — backing out leaves the room running so
    // the artist can walk back in and rejoin it.
    await activeGroupCallStore.clear();
    exitBack();
  };

  const handleSendChat = async () => {
    const text = chatText.trim();
    const id = idRef.current;
    if (!text || !id || sendingChat) return;
    setSendingChat(true);
    setChatText('');
    const res = await groupCallApi.sendChatMessage(id, text);
    if (res.success) refreshActivity();
    else setChatText(text);
    setSendingChat(false);
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

  const stageCopy = isAudioOnly
    ? { title: 'Audio-only session', hint: 'No camera for this call — just your voice.' }
    : camOn
      ? { title: 'Camera is starting…', hint: 'Please allow camera permissions.' }
      : { title: 'Camera is off', hint: 'Turn it back on to show your live feed.' };

  const onStartCall = () => {
    setStartingRoom(true);
    confirmResolveRef.current?.();
  };

  return {
    displayTitle,
    maxParticipants,
    isAudioOnly,
    status,
    elapsed,
    activity,
    participants,
    pending,
    connected,
    pendingRewards,
    pendingSpins,
    fulfillingId,
    peak,
    chatText,
    sendingChat,
    micOn,
    camOn,
    videoKey,
    panel,
    isFullscreen,
    statsOpen,
    manageOpen,
    busyUserId,
    confirmingEnd,
    isEnding,
    errorBanner,
    awaitingConfirm,
    startingRoom,
    videoAvailable,
    sessionEarnings,
    sessionGifts,
    pendingCount,
    stageCopy,
    chatRef,
    setChatText,
    setPanel,
    setIsFullscreen,
    setStatsOpen,
    setManageOpen,
    setConfirmingEnd,
    handleSendChat,
    approve,
    reject,
    remove,
    toggleMute,
    fulfillReward,
    fulfillSpin,
    toggleMic,
    toggleCam,
    endCall,
    exitBack,
    abandonBeforeStart,
    onStartCall,
  };
};
