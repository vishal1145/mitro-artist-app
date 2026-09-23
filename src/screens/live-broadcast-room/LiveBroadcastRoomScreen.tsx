import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { DeliveryCard, RoundChip } from '@components/live';
import { BottomSheet, ConfirmDialog } from '@components/shared';
import { Text } from '@components/ui';
import {
  switchCamera,
} from '@services/agora/agoraEngine';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';
import { formatElapsed } from '@utils/formatElapsed';

import { useLiveBroadcastSession } from './useLiveBroadcastSession';
import { ChatPanel } from './components/ChatPanel';
import { ViewersPanel } from './components/ViewersPanel';
import { SessionStatsSheet } from './components/SessionStatsSheet';

// The round chips, the activity-row markup and the room palette now live in
// @components/live, shared with the group call and private call rooms.

/** Live broadcast room — UI only. All behavior lives in useLiveBroadcastSession(). */
const LiveBroadcastRoomScreen = () => {
  const {
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
  } = useLiveBroadcastSession();

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

      {!isFullscreen && panel === 'viewers' ? (
        <ViewersPanel
          viewerCount={viewerCount}
          viewers={viewers}
          removingId={removingId}
          onRemove={removeViewer}
          onClose={() => setPanel(null)}
        />
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
        peakViewer={peakViewer}
        sessionGifts={sessionGifts}
      />

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
            <Pressable style={styles.confirmBack} onPress={goBack} accessibilityLabel="Back">
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
          <Pressable style={styles.startShow} onPress={onStartShow} accessibilityLabel="Start show">
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
