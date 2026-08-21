import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, layout, radius, spacing } from '@theme';

/** Opacity pulse — 0.4 -> 0.8 -> 0.4, 900ms each leg. */
const MIN_OPACITY = 0.4;
const MAX_OPACITY = 0.8;
const DURATION = 900;

/**
 * Drives one shared value for a whole skeleton tree.
 *
 * Every block reads the same value, so the pulse stays in phase across a list
 * instead of each row drifting on its own timer.
 */
const usePulse = (): SharedValue<number> => {
  const opacity = useSharedValue(MIN_OPACITY);

  opacity.value = withRepeat(
    withTiming(MAX_OPACITY, { duration: DURATION, easing: Easing.inOut(Easing.quad) }),
    -1,
    true,
  );

  return opacity;
};

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  /** Corner radius. Should match whatever the block stands in for. */
  round?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A single placeholder block on the card fill.
 *
 * Size and radius should mirror the real content, so the layout doesn't jump
 * when data arrives. Preferred over spinners for any list or content area.
 */
const SkeletonComponent = ({ width = '100%', height = 16, round, style }: SkeletonProps) => {
  const opacity = usePulse();
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.block,
        { width, height, borderRadius: round ?? radius.chip },
        pulse,
        style,
      ]}
    />
  );
};

export const Skeleton = memo(SkeletonComponent);

/* -------------------------------------------------------------------------- */
/*  Presets — one per shape the app actually renders                          */
/* -------------------------------------------------------------------------- */

export interface SkeletonCardProps {
  /** Rough height of the card being stood in for. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Stands in for a `Card`: same radius, border and padding. */
const SkeletonCardComponent = ({ height = 132, style }: SkeletonCardProps) => (
  <View style={[styles.card, style]}>
    <Skeleton width="46%" height={14} />
    <Skeleton width="100%" height={height - 78} round={radius.sm} style={styles.cardBody} />
    <Skeleton width="30%" height={12} />
  </View>
);

export const SkeletonCard = memo(SkeletonCardComponent);

export interface SkeletonListRowProps {
  /** Leading circle, for avatar- or icon-led rows. */
  avatar?: boolean;
  /** Trailing block, for rows that end in an amount or badge. */
  trailing?: boolean;
}

/** Stands in for a `ListRow` / `TimelineRow`: leading slot, two text lines. */
const SkeletonListRowComponent = ({ avatar = true, trailing = false }: SkeletonListRowProps) => (
  <View style={styles.row}>
    {avatar ? <Skeleton width={44} height={44} round={22} /> : null}
    <View style={styles.rowText}>
      <Skeleton width="58%" height={14} />
      <Skeleton width="36%" height={11} />
    </View>
    {trailing ? <Skeleton width={54} height={14} /> : null}
  </View>
);

export const SkeletonListRow = memo(SkeletonListRowComponent);

/** Stands in for one cell of an inline stat strip: value over label. */
const SkeletonStatTileComponent = () => (
  <View style={styles.tile}>
    <Skeleton width={62} height={22} />
    <Skeleton width={44} height={11} />
  </View>
);

export const SkeletonStatTile = memo(SkeletonStatTileComponent);

export interface SkeletonGroupProps {
  /** How many rows to draw. */
  count?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Repeats `SkeletonListRow` — the common "list is loading" case. */
const SkeletonRowsComponent = ({ count = 4, style }: SkeletonGroupProps) => (
  <View style={[styles.rows, style]}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonListRow key={i} />
    ))}
  </View>
);

export const SkeletonRows = memo(SkeletonRowsComponent);

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: layout.cardPadding,
    paddingHorizontal: layout.cardPadding,
    paddingBottom: layout.cardPaddingBottom,
    gap: spacing.sm,
  },
  cardBody: {
    marginVertical: spacing.xxs,
  },

  rows: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },

  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
