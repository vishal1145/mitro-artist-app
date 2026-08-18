import { Image } from 'expo-image';
import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius } from '@theme';
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
  /** Circle fill behind the initials. Defaults to the brand lavender. */
  color?: string;
  /** Rendered pinned to the bottom-right (e.g. a live dot or tier badge). */
  badge?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Design-spec diameters, run through rf() so they scale with the device. */
const SIZE: Record<AvatarSize, number> = {
  sm: rf(32),
  md: rf(40),
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
      backgroundColor: uri ? colors.surfaceElevated : color,
    }),
    [diameter, color, uri],
  );

  const label = initials ?? (name ? toInitials(name) : '');

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.circle, circleStyle]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={name}
          />
        ) : (
          <Text variant={TEXT_VARIANT[size]} color="white">
            {label}
          </Text>
        )}
      </View>

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
