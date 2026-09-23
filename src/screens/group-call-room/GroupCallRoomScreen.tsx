import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { DeliveryCard, RoomPanel, RoomStartGate, RoundChip, StageControls } from '@components/live';
import { BottomSheet, ConfirmDialog } from '@components/shared';
import { Text } from '@components/ui';
import { switchCamera } from '@services/agora/agoraEngine';
import { callUi, colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';
import { formatElapsed } from '@utils/formatElapsed';

import { useGroupCallSession } from './useGroupCallSession';
import { ChatPanel } from './components/ChatPanel';
import { ParticipantRow } from './components/ParticipantRow';
import { SessionStatsSheet } from './components/SessionStatsSheet';

/** Group call room — UI only. All behavior lives in useGroupCallSession(). */
const GroupCallRoomScreen = () => {
  const {
    displayTitle,
    maxParticipants,
    isAudioOnly,
    status,
    elapsed,
    activity,
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
    abandonBeforeStart,
    onStartCall,
  } = useGroupCallSession();

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
        <ChatPanel
          activity={activity}
          chatText={chatText}
          onChangeChatText={setChatText}
          sendingChat={sendingChat}
          onSend={handleSendChat}
          onClose={() => setPanel(null)}
          chatRef={chatRef}
        />
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
                  <ParticipantRow
                    key={p.userId}
                    participant={p}
                    mode="pending"
                    busyUserId={busyUserId}
                    onApprove={approve}
                    onReject={reject}
                    onToggleMute={toggleMute}
                    onRemove={remove}
                  />
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
              <ParticipantRow
                key={p.userId}
                participant={p}
                mode="connected"
                busyUserId={busyUserId}
                onApprove={approve}
                onReject={reject}
                onToggleMute={toggleMute}
                onRemove={remove}
              />
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
          <DeliveryCard
            icon="gift"
            title="Reward deliveries"
            count={pendingRewards.length}
            rows={pendingRewards.map((o) => (
              <View key={o.id} style={styles.deliveryRow}>
                <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}>
                  <Text variant="caption" color="textPrimary" style={styles.bold}>{o.rewardName}</Text> for {o.buyerDisplayName} · {o.priceCharged} coins
                </Text>
                <Pressable style={styles.markBtn} onPress={() => fulfillReward(o)} disabled={fulfillingId === o.id}>
                  {fulfillingId === o.id ? <ActivityIndicator size="small" color={colors.white} /> : (<><Feather name="check" size={rf(13)} color={colors.white} /><Text variant="label" color="onPrimary" style={styles.bold}>Mark fulfilled</Text></>)}
                </Pressable>
              </View>
            ))}
          />
          <DeliveryCard
            icon="star"
            title="Fun-wheel prizes"
            count={pendingSpins.length}
            rows={pendingSpins.map((s) => (
              <View key={s.id} style={styles.deliveryRow}>
                <Text variant="caption" color="textPrimary" style={styles.deliveryRowText}>
                  <Text variant="caption" color="textPrimary" style={styles.bold}>{s.activityName}</Text> for {s.buyerDisplayName} · {s.priceCharged} coins
                </Text>
                <Pressable style={styles.markBtn} onPress={() => fulfillSpin(s)} disabled={fulfillingId === s.id}>
                  {fulfillingId === s.id ? <ActivityIndicator size="small" color={colors.white} /> : (<><Feather name="check" size={rf(13)} color={colors.white} /><Text variant="label" color="onPrimary" style={styles.bold}>Mark fulfilled</Text></>)}
                </Pressable>
              </View>
            ))}
          />
        </View>
      </BottomSheet>

      {/* Session stats bottom sheet */}
      <SessionStatsSheet
        visible={statsOpen}
        onClose={() => setStatsOpen(false)}
        sessionEarnings={sessionEarnings}
        peak={peak}
        inRoom={connected.length}
        sessionGifts={sessionGifts}
      />

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
          onStart={onStartCall}
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
