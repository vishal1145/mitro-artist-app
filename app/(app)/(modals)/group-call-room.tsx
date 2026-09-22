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

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { ActivityRow, RoomPanel, RoomStartGate, RoundChip, StageControls } from '@components/live';
import { BottomSheet, ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
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
  switchCamera,
} from '@services/agora/agoraEngine';
import type {
  GroupCallActivityItem,
  GroupCallConnectionResponse,
  GroupCallParticipant,
} from '@app-types/groupCall';
import { callUi, colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';
import { showToast } from '@utils/toast';

/* Straight from the artist web's GroupCallManagementScreen — the API sends
   "requested" for a join request, never "pending_approval". */
const PENDING = new Set(['requested']);
const CONNECTED = new Set(['authorized', 'joining', 'connected', 'reconnecting']);

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
const HEARTBEAT_MS = 15000;

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
  // Seeded from the params for a fresh room; overwritten from the stored
  // record when we rejoin a call the artist walked out of (no params then).
  const [displayTitle, setDisplayTitle] = useState((config.title || 'Group Call').trim());
  const [maxParticipants, setMaxParticipants] = useState(config.maxParticipants ?? 8);
  const [isAudioOnly, setIsAudioOnly] = useState(config.mode === 'audio');

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
  const [panel, setPanel] = useState<'chat' | 'participants' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
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

  const pending = participants.filter((p) => PENDING.has(p.status) && !p.isRemoved);
  const connected = participants.filter((p) => CONNECTED.has(p.status) && !p.isRemoved);
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
      const permitted = await requestCallPermissions();
      if (!permitted) {
        bail('Camera and microphone access is needed for a group call. Enable it in Settings.');
        return;
      }

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

  const approve = async (userId: string) => {
    const id = idRef.current;
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, status: 'authorized' } : p)));
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

  const stageCopy = isAudioOnly
    ? { title: 'Audio-only session', hint: 'No camera for this call — just your voice.' }
    : camOn
      ? { title: 'Camera is starting…', hint: 'Please allow camera permissions.' }
      : { title: 'Camera is off', hint: 'Turn it back on to show your live feed.' };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header — call title · seats · LIVE / timer / in-room count */}
      {!isFullscreen ? (
        <View style={styles.header}>
          <View style={styles.headerCreator}>
            <View style={styles.headerNameRow}>
              <View style={styles.liveBadge}>
                {status === 'live' ? <View style={styles.liveBadgeDot} /> : null}
                <Text style={styles.liveBadgeText}>{status === 'live' ? 'LIVE' : 'CONNECTING'}</Text>
              </View>
              <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={styles.headerName}>{displayTitle}</Text>
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>
              {isAudioOnly ? 'Audio-only group call' : 'Group call'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerPill}>
              <Feather name="clock" size={rf(12)} color={colors.textPrimary} />
              <Text style={styles.headerPillText}>{formatElapsed(elapsed)}</Text>
            </View>
            <View style={styles.headerPill}>
              <Feather name="users" size={rf(12)} color={colors.textPrimary} />
              <Text style={styles.headerPillText}>{connected.length}/{maxParticipants}</Text>
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
        {videoAvailable && camOn && !isAudioOnly ? (
          <AgoraVideoView key={videoKey} uid={0} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.stagePlaceholder}>
            <Feather
              name={isAudioOnly ? 'headphones' : camOn ? 'video' : 'video-off'}
              size={rf(40)}
              color={colors.textMuted}
            />
            <Text variant="bodyLg" color="textPrimary" style={styles.bold}>{stageCopy.title}</Text>
            <Text variant="bodySm" color="textMuted">{stageCopy.hint}</Text>
          </View>
        )}

        <Pressable
          style={[styles.fsPill, isFullscreen && styles.fsPillFull]}
          onPress={() => setIsFullscreen((v) => !v)}
          hitSlop={10}
          accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Feather name={isFullscreen ? 'minimize-2' : 'maximize-2'} size={rf(13)} color={callUi.white} />
          <Text style={styles.fsPillText}>{isFullscreen ? 'Exit' : 'Full Screen'}</Text>
        </Pressable>

        {/* Audio-only rooms hide the camera + flip buttons — nothing else differs. */}
        <StageControls
          camOn={camOn}
          micOn={micOn}
          onToggleCam={toggleCam}
          onToggleMic={toggleMic}
          onFlipCamera={videoAvailable && !isAudioOnly ? switchCamera : undefined}
          showCamera={!isAudioOnly}
          topOffset={isFullscreen ? 6 : undefined}
        />

        {status !== 'live' ? (
          <View style={styles.connectingPill}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.connectingText}>Opening the room…</Text>
          </View>
        ) : null}
      </View>

      {/* ── Chat panel ── */}
      {!isFullscreen && panel === 'chat' ? (
        <RoomPanel title="CALL CHAT" onClose={() => setPanel(null)}>
          <ScrollView ref={chatRef} style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
            {activity.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
                <Text variant="bodyLg" color="textPrimary" style={styles.bold}>It&apos;s quiet in here</Text>
                <Text variant="bodySm" color="textMuted" align="center">Once the call is live, chat, reactions, and reward purchases will show up here as they happen.</Text>
              </View>
            ) : activity.map((item) => <ActivityRow key={item.id} item={item} />)}
          </ScrollView>
          <View style={styles.composeRow}>
            <TextInput style={styles.chatInput} value={chatText} onChangeText={setChatText} placeholder="Say something as the host..." placeholderTextColor={colors.textMuted} onSubmitEditing={handleSendChat} returnKeyType="send" maxLength={300} />
            <Pressable style={styles.sendBtn} onPress={handleSendChat} disabled={!chatText.trim() || sendingChat}>
              {sendingChat ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="send" size={rf(16)} color={colors.white} />}
            </Pressable>
          </View>
        </RoomPanel>
      ) : null}

      {/* ── Participants panel (join requests sit on top of the room list) ── */}
      {!isFullscreen && panel === 'participants' ? (
        <RoomPanel title={`PARTICIPANTS (${connected.length}/${maxParticipants})`} onClose={() => setPanel(null)}>
          <ScrollView style={styles.feed} contentContainerStyle={styles.viewerList} showsVerticalScrollIndicator={false}>
            {pending.length > 0 ? (
              <>
                <View style={styles.subHeader}>
                  <Text style={styles.subHeaderText}>JOIN REQUESTS ({pending.length})</Text>
                  <View style={styles.subHeaderRule} />
                </View>
                {pending.map((p) => (
                  <View key={p.userId} style={styles.viewerRow}>
                    <Avatar initials={(p.displayName || '?').slice(0, 1).toUpperCase()} uri={p.avatarUrl ?? undefined} size="sm" />
                    <View style={styles.viewerBody}>
                      <Text variant="caption" color="textPrimary" numberOfLines={1}>{p.displayName || 'Fan'}</Text>
                      <Text variant="label" color="gold">waiting for approval</Text>
                    </View>
                    <Pressable style={styles.approveBtn} onPress={() => approve(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Approve">
                      {busyUserId === p.userId ? <ActivityIndicator size="small" color={colors.green} /> : <Feather name="check" size={rf(15)} color={colors.green} />}
                    </Pressable>
                    <Pressable style={styles.kickBtn} onPress={() => reject(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Reject">
                      <Feather name="x" size={rf(15)} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
                <View style={styles.subHeader}>
                  <Text style={styles.subHeaderText}>IN THE ROOM ({connected.length})</Text>
                  <View style={styles.subHeaderRule} />
                </View>
              </>
            ) : null}

            {connected.length === 0 ? (
              <Text variant="bodySm" color="textMuted" style={styles.viewerEmpty}>No one has joined yet — this list refreshes every 6 seconds.</Text>
            ) : connected.map((p) => (
              <View key={p.userId} style={styles.viewerRow}>
                <Avatar initials={(p.displayName || '?').slice(0, 1).toUpperCase()} uri={p.avatarUrl ?? undefined} size="sm" />
                <View style={styles.viewerBody}>
                  <Text variant="caption" color="textPrimary" numberOfLines={1}>{p.displayName || 'Fan'}</Text>
                  <Text variant="label" color={p.isMuted ? 'danger' : 'green'}>{p.isMuted ? 'muted' : p.status}</Text>
                </View>
                <Pressable style={styles.muteBtn} onPress={() => toggleMute(p)} accessibilityLabel={p.isMuted ? 'Unmute participant' : 'Mute participant'}>
                  <Feather name={p.isMuted ? 'mic-off' : 'mic'} size={rf(15)} color={p.isMuted ? colors.danger : colors.textPrimary} />
                </Pressable>
                <Pressable style={styles.kickBtn} onPress={() => remove(p.userId)} disabled={busyUserId === p.userId} accessibilityLabel="Remove participant">
                  <Feather name="user-x" size={rf(15)} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </RoomPanel>
      ) : null}

      {/* ── Round action bar ── */}
      {!isFullscreen ? (
        <View style={styles.roundBar}>
          <RoundChip variant="danger" icon="phone-off" label="End call" onPress={() => setConfirmingEnd(true)} />
          <RoundChip variant="neutral" icon="message-circle" label="Chat" onPress={() => setPanel((p) => (p === 'chat' ? null : 'chat'))} active={panel === 'chat'} />
          <RoundChip variant="neutral" icon="users" label="Participants" onPress={() => setPanel((p) => (p === 'participants' ? null : 'participants'))} active={panel === 'participants'} badge={pending.length} />
          <RoundChip variant="gift" icon="gift" label="Manage rewards" onPress={() => setManageOpen(true)} badge={pendingCount} />
          <RoundChip variant="stats" icon="bar-chart-2" label="Session stats" onPress={() => setStatsOpen(true)} />
        </View>
      ) : null}

      {/* Manage bottom sheet */}
      <BottomSheet visible={manageOpen} onClose={() => setManageOpen(false)} title="Manage this call" snapPoints={[0.6]}>
        <View style={styles.sheetBody}>
          {deliveryRows(
            'gift',
            'Reward deliveries',
            pendingRewards.length,
            pendingRewards.map((o) => (
              <View key={o.id} style={styles.deliveryRow}>
                <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}>
                  <Text variant="caption" color="textPrimary" style={styles.bold}>{o.rewardName}</Text> for {o.buyerDisplayName} · {o.priceCharged} coins
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
                  <Text variant="caption" color="textPrimary" style={styles.bold}>{s.activityName}</Text> for {s.buyerDisplayName} · {s.priceCharged} coins
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
            <Text variant="h2" color="textPrimary">{peak}</Text>
          </View>
          <View style={styles.statCell}>
            <View style={[styles.statIc, { backgroundColor: colors.purpleSoft }]}><Feather name="user-check" size={rf(16)} color={colors.purple} /></View>
            <Text variant="label" color="textMuted">IN ROOM</Text>
            <Text variant="h2" color="textPrimary">{connected.length}</Text>
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
        icon="stop-circle"
        title="End group call?"
        message="The call will end for everyone. Participants are billed only for the time they spent."
        confirmLabel="End call"
        cancelLabel="Keep going"
        confirmLoading={isEnding}
        onConfirm={endCall}
        onCancel={() => {
          if (!isEnding) setConfirmingEnd(false);
        }}
      />

      {/* ── OFFLINE gate — the room is created but not open yet ── */}
      {awaitingConfirm ? (
        <RoomStartGate
          eyebrow="Group call studio"
          eyebrowIcon="users"
          title={displayTitle}
          note={`Your room is ready — ${maxParticipants} ${maxParticipants === 1 ? 'seat' : 'seats'}. Hit Start Call to open it; fans can join the moment you do.`}
          startLabel="START CALL"
          starting={startingRoom}
          onBack={abandonBeforeStart}
          onStart={() => {
            setStartingRoom(true);
            confirmResolveRef.current?.();
          }}
          camOn={camOn}
          micOn={micOn}
          onToggleCam={toggleCam}
          onToggleMic={toggleMic}
          onFlipCamera={videoAvailable && !isAudioOnly ? switchCamera : undefined}
          showCamera={!isAudioOnly}
        >
          {videoAvailable && camOn && !isAudioOnly ? (
            <AgoraVideoView key={`ready-${videoKey}`} uid={0} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.gatePlaceholder}>
              <Feather
                name={isAudioOnly ? 'headphones' : camOn ? 'video' : 'video-off'}
                size={rf(52)}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.gatePlaceholderTitle}>
                {isAudioOnly ? 'Audio-only session' : camOn ? 'Room preview' : 'Camera is off'}
              </Text>
              <Text variant="bodySm" color="textSecondary" align="center" style={styles.gatePlaceholderHint}>
                {isAudioOnly
                  ? 'No camera for this call — just your voice.'
                  : camOn
                    ? 'This mirrors the shared video grid once participants join the call.'
                    : 'Turn it back on to show your live feed.'}
              </Text>
            </View>
          )}
        </RoomStartGate>
      ) : null}
    </SafeAreaView>
  );
};

/* Styles mirror live-broadcast-room.tsx — same header pills, stage frame,
   panel section, round bar and sheet cards, so both rooms read as one product. */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bold: { fontFamily: fontFamily.bold },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  headerCreator: { flex: 1, minWidth: 0, gap: 3 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerName: { flexShrink: 1, fontFamily: fontFamily.bold },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: radius.pill, backgroundColor: callUi.liveBadge },
  liveBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: callUi.white },
  liveBadgeText: { fontFamily: fontFamily.extrabold, color: callUi.white, fontSize: rf(10.5), letterSpacing: 0.5 },
  headerSub: { flexShrink: 1, fontFamily: fontFamily.semibold, color: callUi.headerSub, fontSize: rf(12) },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: callUi.headerPill },
  headerPillText: { fontFamily: fontFamily.bold, color: colors.textPrimary, fontSize: rf(12) },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.error, marginHorizontal: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md },

  // Video area
  videoArea: { flex: 1, marginHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: spacing.sm, borderRadius: 22, backgroundColor: callUi.stageFill, position: 'relative', overflow: 'hidden', borderWidth: 1.5, borderColor: callUi.stageBorder, alignItems: 'center', justifyContent: 'center' },
  videoAreaFull: { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 0, borderWidth: 0 },
  stagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20 },
  gatePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 28 },
  gatePlaceholderTitle: { fontFamily: fontFamily.bold, fontSize: rf(15), color: colors.white },
  gatePlaceholderHint: { lineHeight: rf(18) },
  fsPill: { position: 'absolute', top: 12, left: 12, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: callUi.glassPill, borderWidth: 1, borderColor: callUi.glassPillBorder },
  /* Fullscreen is inside the same SafeAreaView — the status-bar inset is
     already paid for, so the controls ride the stage's very top edge. */
  fsPillFull: { top: 6 },
  fsPillText: { fontFamily: fontFamily.bold, fontSize: rf(12.5), color: callUi.white },
  connectingPill: { position: 'absolute', bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: callUi.glassPill, borderWidth: 1, borderColor: callUi.glassPillBorder },
  connectingText: { fontFamily: fontFamily.bold, fontSize: rf(12.5), color: callUi.white },

  // Sub-headers inside the participants panel (RoomPanel owns the top header)
  subHeaderText: { fontFamily: fontFamily.bold, color: colors.textMuted, fontSize: rf(11), letterSpacing: 1.1 },
  subHeaderRule: { flex: 1, height: 1, backgroundColor: callUi.hairline },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: 2 },

  feed: { flex: 1 },
  feedContent: { padding: spacing.sm, gap: spacing.sm },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.xl },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  chatInput: { flex: 1, height: wp(10), backgroundColor: colors.glassSurface, borderRadius: radius.pill, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: rf(13) },
  sendBtn: { width: wp(10), height: wp(10), borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  viewerList: { padding: spacing.sm, gap: spacing.sm },
  viewerEmpty: { padding: spacing.md },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  viewerBody: { flex: 1, minWidth: 0 },
  muteBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: callUi.hairline, alignItems: 'center', justifyContent: 'center' },
  kickBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { width: wp(9), height: wp(9), borderRadius: radius.full, backgroundColor: colors.successChip, alignItems: 'center', justifyContent: 'center' },

  // Round action bar
  roundBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: callUi.barSurface, borderWidth: 1, borderColor: colors.border },

  // Session-stats sheet
  statsSheet: { flexDirection: 'row', gap: spacing.xs, paddingTop: spacing.sm },
  statCell: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.md, paddingHorizontal: 2 },
  statIc: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },

  sheetBody: { gap: spacing.sm, paddingTop: spacing.sm },
  deliveryCard: { backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 6 },
  deliveryRowText: { flex: 1 },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
});

export default GroupCallRoomScreen;
