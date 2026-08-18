import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import logo from '@static/images/mitro-logo.jpeg';
import { colors, radius } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface LogoBadgeProps {
  /** 'wave' = the Mitro brand mark on a light rounded tile. */
  /** 'icon' = muted circle containing an Ionicon. */
  variant?: 'wave' | 'icon';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  /** Drop the tile background — use on light surfaces or splash screens. */
  bare?: boolean;
}

/**
 * Brand logo badge.
 *
 * The source artwork is a JPEG with a white background (no transparency), so
 * it sits on a light tile rather than directly on the dark app surface.
 */
const LogoBadgeComponent = ({
  variant = 'wave',
  icon = 'megaphone-outline',
  size = wp(16.7),
  bare = false,
}: LogoBadgeProps) => {
  const sizeStyle = useMemo<ViewStyle>(
    () => ({ width: size, height: size, borderRadius: size * 0.25 }),
    [size],
  );

  if (variant === 'icon') {
    return (
      <View
        style={[styles.circle, sizeStyle]}
        accessibilityRole="image"
        accessibilityLabel="Mitro"
      >
        <Ionicons name={icon} size={size * 0.42} color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.tile, sizeStyle, bare ? styles.bare : null]}
      accessibilityRole="image"
      accessibilityLabel="Mitro"
    >
      <Image source={logo} style={styles.image} contentFit="contain" transition={150} />
    </View>
  );
};

export const LogoBadge = memo(LogoBadgeComponent);

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // The artwork's own white backdrop — keeps the mark legible on dark UI.
    backgroundColor: colors.white,
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: rf(4) },
    shadowOpacity: 0.5,
    shadowRadius: wp(7.5),
    elevation: 10,
  },
  bare: {
    backgroundColor: colors.transparent,
    shadowOpacity: 0,
    elevation: 0,
  },
  circle: {
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
