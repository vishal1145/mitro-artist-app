import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

/** Seconds of call time covered by the upfront charge. */
const PREPAID_SEC = 5 * 60;

/** hh:mm:ss elapsed formatter. */
const formatElapsed = (total: number): string => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const PrivateCallRoomScreen = () => {
  const router = useRouter();
  const { callId, fanId, ratePerMin } = useLocalSearchParams<{
    callId?: string;
    fanId?: string;
    ratePerMin?: string;
  }>();

  const fanName = fanId ?? 'Riya Sharma';
  const rate = Number(ratePerMin) || 24;

  // Start partway through the prepaid window so the transition is visible.
  const [elapsed, setElapsed] = useState(4 * 60 + 32);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const inPrepaid = elapsed < PREPAID_SEC;
  const untilBilling = Math.max(0, PREPAID_SEC - elapsed);
  // Drains while prepaid, then sits full once per-minute billing takes over.
  const barWidth = useMemo<ViewStyle>(
    () => ({
      width: inPrepaid
        ? (`${(untilBilling / PREPAID_SEC) * 100}%` as const)
        : ('100%' as const),
    }),
    [inPrepaid, untilBilling],
  );

  // Prepaid covers the first 5 minutes; after that each started minute bills.
  const billedMinutes = inPrepaid
    ? 5
    : 5 + Math.ceil((elapsed - PREPAID_SEC) / 60);
  const earned = billedMinutes * rate;

  /** Dismiss the modal stack so nothing is left pushed on the Calls tab. */
  const endCall = () => {
    setConfirmingEnd(false);
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(app)/(tabs)/calls');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Remote video placeholder */}
      <View style={styles.stage}>
        <Avatar initials="RS" name={fanName} size="xl" />
        <Text variant="caption" color="textMuted">
          {fanName}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="h3" numberOfLines={1}>
            {fanName}
          </Text>
          <Ionicons name="checkmark-circle" size={rf(15)} color={colors.primary} />
          <View style={styles.privatePill}>
            <Text variant="label" color="primary">
              PRIVATE
            </Text>
          </View>
        </View>
        <Text variant="label" color="textSecondary">
          {formatElapsed(elapsed)}
        </Text>
      </View>

      {/* Billing banner */}
      <View style={styles.billing}>
        <View style={styles.billingAccent} />
        <View style={styles.billingBody}>
          <View style={styles.billingRow}>
            <Ionicons name="timer-outline" size={rf(14)} color={colors.warning} />
            <Text variant="caption" color="textPrimary" style={styles.billingText}>
              {inPrepaid
                ? `First 5 minutes prepaid · per-minute billing starts in ${Math.floor(untilBilling / 60)}:${String(untilBilling % 60).padStart(2, '0')}`
                : `Per-minute billing active · ${billedMinutes} min billed`}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, barWidth, inPrepaid ? null : styles.fillActive]} />
          </View>
        </View>
      </View>

      {/* Local camera PiP — sits BELOW the billing banner, never overlapping it */}
      <View style={styles.pipRow}>
        <View style={styles.pip}>
          {camOn ? (
            <>
              <Ionicons name="person" size={rf(22)} color={colors.textMuted} />
              <Text variant="caption" color="textMuted" style={styles.pipLabel}>
                You
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="videocam-off" size={rf(20)} color={colors.textMuted} />
              <Text variant="caption" color="textMuted" style={styles.pipLabel}>
                Camera off
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Live earnings */}
      <View style={styles.earnings}>
        <Ionicons name="cash-outline" size={rf(15)} color={colors.success} />
        <Text variant="label" color="success">
          {rate} tk/min · {earned} tk earned
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.ctrlBtn}
          onPress={() => setMicOn((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={rf(20)} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          style={styles.ctrlBtn}
          onPress={() => setCamOn((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={camOn ? 'Turn camera off' : 'Turn camera on'}
        >
          <Ionicons
            name={camOn ? 'videocam' : 'videocam-off'}
            size={rf(20)}
            color={colors.textPrimary}
          />
        </Pressable>

        <Pressable
          style={styles.endBtn}
          onPress={() => setConfirmingEnd(true)}
          accessibilityRole="button"
          accessibilityLabel={`End call ${callId ?? ''}`}
        >
          <Ionicons name="call" size={rf(26)} color={colors.onError} style={styles.endIcon} />
        </Pressable>

        <Pressable style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Flip camera">
          <Ionicons name="camera-reverse" size={rf(20)} color={colors.textPrimary} />
        </Pressable>

        <Pressable style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Call chat">
          <Ionicons name="chatbubble" size={rf(20)} color={colors.textPrimary} />
          <View style={styles.badgeDot} />
        </Pressable>
      </View>

      <ConfirmDialog
        visible={confirmingEnd}
        icon="call-outline"
        title="End call?"
        message={`The call with ${fanName} will end for both of you.`}
        confirmLabel="End call"
        cancelLabel="Keep talking"
        onConfirm={endCall}
        onCancel={() => setConfirmingEnd(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.glassSurface,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  privatePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },

  billing: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  billingAccent: {
    width: wp(1),
    backgroundColor: colors.warning,
  },
  billingBody: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  billingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  billingText: {
    flex: 1,
  },
  track: {
    height: wp(1),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.warning,
  },
  fillActive: {
    backgroundColor: colors.success,
  },

  // PiP row follows the banner in normal flow, so the two can never overlap.
  pipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  pip: {
    width: wp(26),
    height: wp(35),
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pipLabel: {
    fontSize: rf(10),
  },

  spacer: {
    flex: 1,
  },

  earnings: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginLeft: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.glassSurface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.glassSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  ctrlBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    width: wp(16),
    height: wp(16),
    borderRadius: radius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hang-up is the phone glyph rotated 135deg.
  endIcon: {
    transform: [{ rotate: '135deg' }],
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: wp(3),
    height: wp(3),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

export default PrivateCallRoomScreen;
