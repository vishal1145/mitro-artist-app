import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients, radius } from '@theme';

export interface ProgressBarProps {
  /** Fill fraction, 0..1. Values outside the range are clamped. */
  value: number;
  /** Track height in points. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Seat / capacity meter. The fill runs pink -> violet left to right, so the
 * gradient direction is the reverse of the CTA's.
 */
const ProgressBarComponent = ({ value, height = 6, style }: ProgressBarProps) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <LinearGradient
        colors={gradients.cta}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={[styles.fill, { width: `${pct}%`, borderRadius: height / 2 }]}
      />
    </View>
  );
};

export const ProgressBar = memo(ProgressBarComponent);

const styles = StyleSheet.create({
  track: {
    flex: 1,
    backgroundColor: colors.cardRaised,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
