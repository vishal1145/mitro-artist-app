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

/** Opacity pulse — 0.5 -> 0.9 -> 0.5, 700ms each leg (matches web `skeletonPulse` 1.4s). */
const MIN_OPACITY = 0.5;
const MAX_OPACITY = 0.9;
const DURATION = 700;

/**
 * Drives one shared value for a whole skeleton tree.
 *
 * Every block reads the same value, so the pulse stays in phase across a list
 * instead of each row drifting on its own timer.
 */
const usePulse = (): SharedValue<number> => {
  const opacity = useSharedValue(MIN_OPACITY);

  opacity.value = withRepeat(
    withTiming(MAX_OPACITY, {
      duration: DURATION,
      easing: Easing.inOut(Easing.quad),
    }),
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
const SkeletonComponent = ({
  width = '100%',
  height = 16,
  round,
  style,
}: SkeletonProps) => {
  const opacity = usePulse();
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.block,
        { width, height, borderRadius: round ?? 10 },
        pulse,
        style,
      ]}
    />
  );
};

export const Skeleton = memo(SkeletonComponent);

/* -------------------------------------------------------------------------- */
/*  Primitives — the building blocks every screen skeleton composes from      */
/* -------------------------------------------------------------------------- */

export interface SkeletonTextProps {
  /** Line width — pass a % to track a fluid text column. */
  width?: number | `${number}%`;
  /** Line thickness. Defaults to a body-text line. */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** A single text line. Radius stays tight (6) like the web `.mitro-skel-line`. */
const SkeletonTextComponent = ({
  width = '100%',
  height = 12,
  style,
}: SkeletonTextProps) => (
  <Skeleton width={width} height={height} round={6} style={style} />
);

export const SkeletonText = memo(SkeletonTextComponent);

export interface SkeletonCircleProps {
  /** Diameter — used for avatars and round icon slots. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** A round placeholder — avatars, round icon badges. */
const SkeletonCircleComponent = ({ size = 44, style }: SkeletonCircleProps) => (
  <Skeleton width={size} height={size} round={size / 2} style={style} />
);

export const SkeletonCircle = memo(SkeletonCircleComponent);

export interface SkeletonBoxProps {
  /** Square/rounded icon tile — width defaults to the same as height. */
  size?: number;
  width?: number | `${number}%`;
  height?: number;
  round?: number;
  style?: StyleProp<ViewStyle>;
}

/** A rounded square — icon tiles, thumbnails. */
const SkeletonBoxComponent = ({
  size = 36,
  width,
  height,
  round = 12,
  style,
}: SkeletonBoxProps) => (
  <Skeleton
    width={width ?? size}
    height={height ?? size}
    round={round}
    style={style}
  />
);

export const SkeletonBox = memo(SkeletonBoxComponent);

export interface SkeletonButtonProps {
  width?: number | `${number}%`;
  height?: number;
  round?: number;
  style?: StyleProp<ViewStyle>;
}

/** A button/pill placeholder. */
const SkeletonButtonComponent = ({
  width = 130,
  height = 44,
  round = 12,
  style,
}: SkeletonButtonProps) => (
  <Skeleton width={width} height={height} round={round} style={style} />
);

export const SkeletonButton = memo(SkeletonButtonComponent);

export interface SkeletonImageProps {
  width?: number | `${number}%`;
  height?: number;
  round?: number;
  style?: StyleProp<ViewStyle>;
}

/** An image/media placeholder — reserve the exact box the image will fill. */
const SkeletonImageComponent = ({
  width = '100%',
  height = 160,
  round = radius.sm,
  style,
}: SkeletonImageProps) => (
  <Skeleton width={width} height={height} round={round} style={style} />
);

export const SkeletonImage = memo(SkeletonImageComponent);

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
    <Skeleton
      width="100%"
      height={height - 78}
      round={radius.sm}
      style={styles.cardBody}
    />
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
const SkeletonListRowComponent = ({
  avatar = true,
  trailing = false,
}: SkeletonListRowProps) => (
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

/**
 * Stands in for a notification row: left accent bar, 36×36 rounded icon tile,
 * a title line with a short trailing "time" block, and two body lines. Mirrors
 * the loaded `.note` row so the list doesn't jump when data arrives.
 */
const SkeletonNotificationRowComponent = () => (
  <View style={styles.noteRow}>
    <View style={styles.noteAccent} />
    <SkeletonBox size={36} round={12} />
    <View style={styles.noteText}>
      <View style={styles.noteHead}>
        <SkeletonText width="52%" height={13} />
        <SkeletonText width={32} height={11} />
      </View>
      <SkeletonText width="90%" height={11} />
      <SkeletonText width="66%" height={11} />
    </View>
  </View>
);

export const SkeletonNotificationRow = memo(SkeletonNotificationRowComponent);

/** Repeats the notification row — the notifications list / dashboard bell card. */
const SkeletonNotificationRowsComponent = ({
  count = 5,
  style,
}: SkeletonGroupProps) => (
  <View style={[styles.noteRows, style]}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonNotificationRow key={i} />
    ))}
  </View>
);

export const SkeletonNotificationRows = memo(SkeletonNotificationRowsComponent);

const styles = StyleSheet.create({
  block: {
    backgroundColor: 'rgba(255,255,255,0.06)',
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

  noteRows: {
    gap: spacing.sm,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: 14,
    paddingVertical: 12,
  },
  noteAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  noteText: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});
