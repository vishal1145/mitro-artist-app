import { memo, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { colors } from '@theme';
import { SCREEN, wp } from '@utils/responsive';

/**
 * Ambient backdrop for auth screens: a faint grid texture plus two soft
 * radial glows bleeding in from opposite corners. Purely decorative — sits
 * behind the scrollable content via `position: absolute`.
 */
const GRID_SIZE = 40;

const AuthBackgroundComponent = () => {
  return (
    <View style={styles.root} pointerEvents="none">
      <Svg
        width={SCREEN.width}
        height={SCREEN.height}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <Pattern
            id="grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke={colors.primary}
              strokeWidth={1}
              opacity={0.04}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>

      {/* Top-left glow (lavender), bottom-right glow (magenta, echoes the CTA glow). */}
      <GlowOrb color={colors.primary} anchor="topLeft" />
      <GlowOrb color={colors.accentPink} anchor="bottomRight" />
    </View>
  );
};

interface GlowOrbProps {
  color: string;
  anchor: 'topLeft' | 'bottomRight';
}

/** Approximates a soft radial glow with three concentric, low-opacity rings. */
const GlowOrb = ({ color, anchor }: GlowOrbProps) => {
  const positionStyle =
    anchor === 'topLeft' ? styles.orbTopLeft : styles.orbBottomRight;
  const tintStyle = useMemo<ViewStyle>(() => ({ backgroundColor: color }), [color]);

  return (
    <View style={[styles.orbWrapper, positionStyle]}>
      <View style={[styles.ring, styles.ringOuter, tintStyle]} />
      <View style={[styles.ring, styles.ringMid, tintStyle]} />
      <View style={[styles.ring, styles.ringInner, tintStyle]} />
    </View>
  );
};

const ORB_SIZE = wp(90);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  orbWrapper: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbTopLeft: {
    top: -ORB_SIZE * 0.4,
    left: -ORB_SIZE * 0.4,
  },
  orbBottomRight: {
    bottom: -ORB_SIZE * 0.4,
    right: -ORB_SIZE * 0.4,
  },
  ring: {
    position: 'absolute',
    borderRadius: ORB_SIZE,
  },
  ringOuter: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    opacity: 0.05,
  },
  ringMid: {
    width: ORB_SIZE * 0.66,
    height: ORB_SIZE * 0.66,
    opacity: 0.08,
  },
  ringInner: {
    width: ORB_SIZE * 0.33,
    height: ORB_SIZE * 0.33,
    opacity: 0.12,
  },
});

export const AuthBackground = memo(AuthBackgroundComponent);
