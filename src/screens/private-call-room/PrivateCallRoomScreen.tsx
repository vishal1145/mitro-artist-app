import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RoundChip,
  StageControls,
  live,
  DeliveryCard,
} from '@components/live';
import { BottomSheet, ConfirmDialog } from '@components/shared';
import { Text } from '@components/ui';
import { switchCamera } from '@services/agora/agoraEngine';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';
import { formatElapsed } from '@utils/formatElapsed';

import { usePrivateCallSession } from './usePrivateCallSession';
import { ConnectionBanners } from './components/ConnectionBanners';
import { FanStage } from './components/FanStage';
import { LocalPip } from './components/LocalPip';
import { ActivityPanel } from './components/ActivityPanel';

/**
 * Private (1:1) call studio.
 *
 * The chrome is the Live Broadcast studio's: the same stage, quick controls,
 * fullscreen pill, slide-in panel, round action bar and bottom sheets.
 *
 * UI only. All behavior lives in usePrivateCallSession().
 */
const PrivateCallRoomScreen = () => {
  const {
    fanName,
    ratePerMin,
    elapsed,
    remoteUid,
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
  } = usePrivateCallSession();

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
                ? `Private call · ${ratePerMin} coins/min`
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

      <ConnectionBanners
        isFullscreen={isFullscreen}
        errorBanner={errorBanner}
        endingNotice={endingNotice}
        peerReconnecting={peerReconnecting}
        selfReconnecting={selfReconnecting}
        fanName={fanName}
      />

      {/* ── Video stage: the fan fills it, the artist sits in the PIP ── */}
      <View style={[styles.videoArea, isFullscreen && styles.videoAreaFull]}>
        <FanStage
          fanVideoLive={fanVideoLive}
          remoteUid={remoteUid}
          connected={connected}
          fanName={fanName}
          remoteAudioOn={remoteAudioOn}
        />

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

        <LocalPip videoAvailable={videoAvailable} camOn={camOn} videoKey={videoKey} />
      </View>

      {/* ── Activity / Guest panel (opened from the round bar) ── */}
      {!isFullscreen && panel === 'activity' ? (
        <ActivityPanel activity={activity} fanName={fanName} onClose={() => setPanel(null)} feedRef={feedRef} />
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
          <DeliveryCard
            icon="gift"
            title="Reward deliveries"
            count={pendingRewards.length}
            rows={pendingRewards.map((o) => (
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
                  for {o.buyerDisplayName} · {o.priceCharged} coins
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
            ))}
          />
          <DeliveryCard
            icon="star"
            title="Fun-wheel prizes"
            count={pendingSpins.length}
            rows={pendingSpins.map((s) => (
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
                  for {s.buyerDisplayName} · {s.priceCharged} coins
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
            ))}
          />
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
