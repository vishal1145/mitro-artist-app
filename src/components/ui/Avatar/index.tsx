import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, gradientDirection, gradients, radius, size as sizes } from '@theme';
import { rf } from '@utils/responsive';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Full name — initials are derived from it when no image is supplied. */
  name?: string;
  /** Explicit initials, overriding the ones derived from `name`. */
  initials?: string;
  /** Remote or local image. Falls back to initials while loading / on error. */
  uri?: string;
  size?: AvatarSize;
  /** Solid fill that overrides the brand gradient. */
  color?: string;
  /** Rendered pinned to the bottom-right (e.g. a live dot or tier badge). */
  badge?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Design-spec diameters. `md` matches the spec's 44pt avatar. */
const SIZE: Record<AvatarSize, number> = {
  sm: rf(32),
  md: sizes.avatar,
  lg: rf(48),
  xl: rf(120),
};

/** Text variant that best fits each diameter. */
const TEXT_VARIANT: Record<AvatarSize, 'caption' | 'link' | 'h2' | 'display'> = {
  sm: 'caption',
  md: 'link',
  lg: 'h2',
  xl: 'display',
};

/** Derive up to two uppercase initials from a display name. */
const toInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Circular avatar. Renders `uri` when provided, otherwise initials on a
 * tinted circle. Use the `badge` slot for status dots or tier marks.
 */
const AvatarComponent = ({
  name,
  initials,
  uri,
  size = 'md',
  color = colors.primaryDark,
  badge,
  style,
}: AvatarProps) => {
  const diameter = SIZE[size];

  const circleStyle = useMemo<ViewStyle>(
    () => ({
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
    }),
    [diameter],
  );

  const label = initials ?? (name ? toInitials(name) : '');
  /** A caller-supplied colour overrides the brand gradient. */
  const solidFill = color ? { backgroundColor: color } : null;

  return (
    <View style={[styles.wrapper, style]}>
      {uri ? (
        <View style={[styles.circle, circleStyle, styles.imageFill]}>
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={name}
          />
        </View>
      ) : solidFill ? (
        <View style={[styles.circle, circleStyle, solidFill]}>
          <Text variant={TEXT_VARIANT[size]} color="white" style={styles.initials}>
            {label}
          </Text>
        </View>
      ) : (
        // Spec: circular, 135deg purple -> pink, white initials weight 800.
        <LinearGradient
          colors={gradients.avatar}
          start={gradientDirection.diagonal.start}
          end={gradientDirection.diagonal.end}
          style={[styles.circle, circleStyle]}
        >
          <Text variant={TEXT_VARIANT[size]} color="white" style={styles.initials}>
            {label}
          </Text>
        </LinearGradient>
      )}

      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </View>
  );
};

export const Avatar = memo(AvatarComponent);

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageFill: {
    backgroundColor: colors.cardRaised,
  },
  initials: {
    fontFamily: fontFamily.extrabold,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.background,
    overflow: 'hidden',
  },
});
