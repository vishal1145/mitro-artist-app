import { memo, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius } from '@theme';

export interface PasswordStrengthMeterProps {
  /** Score 0..3 from authPasswordStrength(). */
  score: number;
}

/** Segment tint per score: weak / medium / strong. */
const TINT = [colors.red, colors.red, colors.gold, colors.green] as const;

/**
 * Three-segment password strength bar.
 * Scoring: 8+ characters, contains a number, contains a symbol.
 */
const PasswordStrengthMeterComponent = ({ score }: PasswordStrengthMeterProps) => {
  const clamped = Math.max(0, Math.min(score, 3));

  const barStyles = useMemo<ViewStyle[]>(
    () =>
      [0, 1, 2].map((index) => ({
        backgroundColor: index < clamped ? TINT[clamped] : colors.border,
      })),
    [clamped],
  );

  return (
    <View style={styles.bars} accessibilityRole="progressbar">
      {barStyles.map((barStyle, index) => (
        <View key={index} style={[styles.bar, barStyle]} />
      ))}
    </View>
  );
};

export const PasswordStrengthMeter = memo(PasswordStrengthMeterComponent);

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: radius.sm,
  },
});
