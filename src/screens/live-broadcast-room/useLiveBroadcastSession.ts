import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

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
} from '@services/agora/agoraEngine';
import type { BroadcastActivityItem, BroadcastViewer, StartBroadcastResponse } from '@app-types/broadcast';
import { showToast } from '@utils/toast';

import type { UseLiveBroadcastSessionResult } from './useLiveBroadcastSession.types';

const ACTIVITY_POLL_MS = 15000;
const VIEWERS_POLL_MS = 5000;
const DELIVERIES_POLL_MS = 12000;
const HEARTBEAT_MS = 15000;

/** All live-broadcast-room logic. The screen component renders state; it holds none. */
export const useLiveBroadcastSession = (): UseLiveBroadcastSessionResult => {
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

  const goBack = () => router.back();
  const onStartShow = () => confirmResolveRef.current?.();

  return {
    displayTitle,
    liveTitle,
    liveCategory,
    status,
    awaitingConfirm,
    elapsed,
    viewerCount,
    peakViewer,
    activity,
    viewers,
    pendingRewards,
    pendingSpins,
    fulfillingId,
    chatText,
    sendingChat,
    micOn,
    camOn,
    videoKey,
    panel,
    isFullscreen,
    statsOpen,
    manageOpen,
    removingId,
    confirmingEnd,
    isEnding,
    errorBanner,
    videoAvailable,
    sessionEarnings,
    sessionGifts,
    pendingCount,
    chatRef,
    setChatText,
    setPanel,
    setIsFullscreen,
    setStatsOpen,
    setManageOpen,
    setConfirmingEnd,
    handleSendChat,
    fulfillReward,
    fulfillSpin,
    removeViewer,
    toggleMic,
    toggleCam,
    endBroadcast,
    goBack,
    onStartShow,
  };
};
