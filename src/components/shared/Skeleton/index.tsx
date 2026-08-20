import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  /** Corner radius. Defaults to the small chip radius. */
  round?: number;
  style?: StyleProp<ViewStyle>;
}

/** Spec: opacity pulses 0.3 <-> 0.7 over 850ms. */
const MIN_OPACITY = 0.3;
const MAX_OPACITY = 0.7;
const DURATION = 850;

/**
 * Shimmer placeholder block.
 *
 * The design system prefers these over spinners or "Loading…" text for list
 * and content placeholders — `ActivityIndicator` is reserved for inline
 * button and footer loading only.
 */
const SkeletonComponent = ({ width = '100%', height = 16, round, style }: SkeletonProps) => {
  const pulse = useRef(new Animated.Value(MIN_OPACITY)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: MAX_OPACITY,
          duration: DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: MIN_OPACITY,
          duration: DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.block,
        { width, height, borderRadius: round ?? radius.chip, opacity: pulse },
        style,
      ]}
    />
  );
};

export const Skeleton = memo(SkeletonComponent);

export interface SkeletonRowsProps {
  /** How many placeholder rows to draw. */
  count?: number;
  /** Show a leading circle, for avatar-led lists. */
  avatar?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Stack of list-row placeholders: optional avatar, title line, meta line. */
const SkeletonRowsComponent = ({ count = 3, avatar = false, style }: SkeletonRowsProps) => (
  <View style={[styles.rows, style]}>
    {Array.from({ length: count }, (_, i) => (
      <View key={i} style={styles.row}>
        {avatar ? <Skeleton width={44} height={44} round={22} /> : null}
        <View style={styles.rowText}>
          <Skeleton width="62%" height={14} />
          <Skeleton width="38%" height={11} />
        </View>
      </View>
    ))}
  </View>
);

export const SkeletonRows = memo(SkeletonRowsComponent);

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceSoft,
  },
  rows: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
});
