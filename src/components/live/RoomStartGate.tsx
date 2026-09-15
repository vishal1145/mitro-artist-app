import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

import { live } from './liveTokens';
import { StageControls } from './StageControls';

type FeatherIconName = keyof typeof Feather.glyphMap;

export interface RoomStartGateProps {
  /** Small pink label above the title, e.g. "Group call studio". */
  eyebrow: string;
  eyebrowIcon: FeatherIconName;
  title: string;
  /** Sentence under the progress bar explaining what happens on start. */
  note: string;
  /** Uppercase CTA text, e.g. "START CALL". */
  startLabel: string;
  starting?: boolean;
  onBack: () => void;
  onStart: () => void;
  /** Camera preview (or its placeholder) that fills the stage. */
  children: ReactNode;
  camOn: boolean;
  micOn: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onFlipCamera?: () => void;
  showCamera?: boolean;
}

/**
 * The OFFLINE confirmation screen a room shows before it actually opens —
 * the artist web's "Start Call" gate, in the broadcast studio's layout.
 *
 * Nothing is live behind this: the camera is previewing locally, the room is
 * created but not started, and only the CTA hands control back to the caller.
 */
export const RoomStartGate = memo(
  ({
    eyebrow,
    eyebrowIcon,
    title,
    note,
    startLabel,
    starting = false,
    onBack,
    onStart,
    children,
    camOn,
    micOn,
    onToggleCam,
    onToggleMic,
    onFlipCamera,
    showCamera = true,
  }: RoomStartGateProps) => (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <View style={styles.eyebrowRow}>
            <Feather name={eyebrowIcon} size={rf(13)} color={live.gateEyebrow} />
            <Text style={styles.eyebrowText}>{eyebrow}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text variant="h2" color="textPrimary" numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          </View>
        </View>
        <View style={styles.stats}>
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

      <View style={styles.progressBar}>
        <View style={styles.progressSegments}>
          <View style={[styles.progSeg, styles.progSegFilled]} />
          <View style={styles.progSeg} />
          <View style={styles.progSeg} />
          <View style={styles.progSeg} />
        </View>
        <Text style={styles.progressText}>{note}</Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.cameraBadge}>
          <View style={styles.cameraBadgeDot} />
          <Text style={styles.cameraBadgeText}>OFFLINE</Text>
        </View>
        <StageControls
          camOn={camOn}
          micOn={micOn}
          onToggleCam={onToggleCam}
          onToggleMic={onToggleMic}
          onFlipCamera={onFlipCamera}
          showCamera={showCamera}
        />
        {children}
      </View>

      <Pressable
        style={[styles.start, starting && styles.startBusy]}
        onPress={onStart}
        disabled={starting}
        accessibilityRole="button"
        accessibilityState={{ disabled: starting, busy: starting }}
        accessibilityLabel={startLabel}
      >
        <LinearGradient
          colors={live.activeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startFill}
        >
          {starting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Feather name="play" size={rf(14)} color={colors.white} />
          )}
          <Text style={styles.startText}>{starting ? 'STARTING…' : startLabel}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  ),
);
RoomStartGate.displayName = 'RoomStartGate';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, gap: 4 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowText: { fontFamily: fontFamily.extrabold, fontSize: rf(12), letterSpacing: 0.3, color: live.gateEyebrow },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1 },
  stats: { alignItems: 'flex-end', gap: 6 },
  offlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: live.offlineDot },
  offlinePillText: { fontFamily: fontFamily.extrabold, fontSize: rf(11), letterSpacing: 0.5, color: colors.textPrimary },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  progressBar: {
    gap: 10,
    marginTop: spacing.md,
    padding: 12,
    borderWidth: 1,
    borderColor: live.panelBorder,
    borderRadius: radius.md,
    backgroundColor: live.panelFill,
  },
  progressSegments: { flexDirection: 'row', gap: 6 },
  progSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: live.progressTrack },
  progSegFilled: { backgroundColor: colors.pink },
  progressText: { fontFamily: fontFamily.body, fontSize: rf(12.5), lineHeight: rf(19), color: colors.textSecondary },

  stage: {
    flex: 1,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: live.panelBorder,
    backgroundColor: live.stageDark,
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
    backgroundColor: live.overlayBadge,
    borderWidth: 1,
    borderColor: live.overlayBadgeBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cameraBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: live.offlineDot },
  cameraBadgeText: { fontFamily: fontFamily.extrabold, fontSize: rf(10.5), letterSpacing: 0.4, color: colors.textPrimary },

  start: { height: 52, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  startBusy: { opacity: 0.8 },
  startFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startText: { fontFamily: fontFamily.extrabold, fontSize: rf(14), letterSpacing: 0.6, color: colors.white },
});
