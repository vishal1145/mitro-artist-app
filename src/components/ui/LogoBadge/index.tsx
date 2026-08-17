import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, gradients, radius } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface LogoBadgeProps {
  /** 'wave' = gradient square with an audio waveform (brand mark). */
  /** 'icon' = muted circle containing an Ionicon. */
  variant?: 'wave' | 'icon';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
}

// Relative bar heights (0..1) for the waveform mark.
const BARS = [0.42, 0.72, 1, 0.56, 0.86, 0.34] as const;

/** Brand logo badge used at the top of the auth screens. */
const LogoBadgeComponent = ({
  variant = 'wave',
  icon = 'megaphone-outline',
  size = wp(19),
}: LogoBadgeProps) => {
  const sizeStyle = useMemo<ViewStyle>(
    () => ({ width: size, height: size }),
    [size],
  );

  const barStyles = useMemo<ViewStyle[]>(() => {
    const barWidth = size * 0.07;
    const maxBarHeight = size * 0.5;
    return BARS.map((ratio) => ({
      width: barWidth,
      height: maxBarHeight * ratio,
      marginHorizontal: barWidth * 0.35,
    }));
  }, [size]);

  const [brandStart, brandEnd] = gradients.brand;

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
    <LinearGradient
      colors={[brandStart, brandEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.square, sizeStyle]}
      accessibilityRole="image"
      accessibilityLabel="Mitro"
    >
      <View style={styles.bars}>
        {barStyles.map((barStyle, index) => (
          <View key={index} style={[styles.bar, barStyle]} />
        ))}
      </View>
    </LinearGradient>
  );
};

export const LogoBadge = memo(LogoBadgeComponent);

const styles = StyleSheet.create({
  square: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: rf(6) },
    shadowOpacity: 0.5,
    shadowRadius: wp(4),
    elevation: 10,
  },
  circle: {
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
});
