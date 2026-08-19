import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import logo from '@static/images/mitro-logo.jpeg';
import { colors, gradientDirection, gradients, radius } from '@theme';
import { wp } from '@utils/responsive';

export interface AuthLogoProps {
  /** Outer ring diameter. */
  size?: number;
}

/**
 * Auth-screen brand mark: a gradient ring around the Mitro logo.
 *
 * NOTE: the source artwork is a white-background JPEG, so the inner disc is
 * white. Swap in a transparent PNG/SVG to sit the mark on a dark disc as the
 * reference does.
 */
const AuthLogoComponent = ({ size = wp(26) }: AuthLogoProps) => {
  const ring = { width: size, height: size, borderRadius: size / 2 };

  return (
    <LinearGradient
      colors={gradients.avatar}
      start={gradientDirection.diagonal.start}
      end={gradientDirection.diagonal.end}
      style={[styles.ring, ring]}
      accessibilityRole="image"
      accessibilityLabel="Mitro"
    >
      <View style={styles.inner}>
        <Image source={logo} style={styles.image} contentFit="contain" transition={150} />
      </View>
    </LinearGradient>
  );
};

export const AuthLogo = memo(AuthLogoComponent);

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    // Ring thickness.
    padding: 2,
  },
  inner: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
