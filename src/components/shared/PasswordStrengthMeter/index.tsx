import { memo, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { hp } from '@utils/responsive';

export interface PasswordStrengthMeterProps {
  /** Score 0..4 from passwordStrength(). */
  score: number;
}

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const BAR_COLORS = [
  colors.error,
  colors.error,
  colors.warning,
  colors.info,
  colors.success,
] as const;

/** Visual password strength indicator (4 segments). */
const PasswordStrengthMeterComponent = ({
  score,
}: PasswordStrengthMeterProps) => {
  const clamped = Math.max(0, Math.min(score, 4));
  const tint = BAR_COLORS[clamped];

  const barStyles = useMemo<ViewStyle[]>(
    () =>
      [0, 1, 2, 3].map((index) => ({
        backgroundColor: index < clamped ? tint : colors.border,
      })),
    [clamped, tint],
  );

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {barStyles.map((barStyle, index) => (
          <View key={index} style={[styles.bar, barStyle]} />
        ))}
      </View>
      <Text variant="caption" color="textMuted">
        {LABELS[clamped]}
      </Text>
    </View>
  );
};

export const PasswordStrengthMeter = memo(PasswordStrengthMeterComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    gap: spacing.xxs,
  },
  bars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bar: {
    flex: 1,
    height: hp(0.6),
    borderRadius: radius.sm,
  },
});
