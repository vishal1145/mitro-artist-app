import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { authGlow } from '@theme';
import { SCREEN } from '@utils/responsive';

/**
 * Auth-screen backdrop: two soft radial glows over the flat screen colour.
 *
 * Content screens stay flat black — this belongs to auth screens only.
 * Spec:
 *   70% 45% at 12% 2%  rgba(255,63,173,0.16) -> transparent 55%
 *   70% 45% at 88% 4%  rgba(107,45,244,0.20) -> transparent 55%
 */
const AuthBackgroundComponent = () => {
  const { width, height } = SCREEN;

  return (
    <View style={styles.root} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {authGlow.orbs.map((orb, i) => (
            <RadialGradient key={i} id={`glow${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={orb.color} />
              {/* Spec fades to transparent at 55%. */}
              <Stop offset="55%" stopColor={orb.color} stopOpacity={0} />
              <Stop offset="100%" stopColor={orb.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        {authGlow.orbs.map((orb, i) => (
          <Ellipse
            key={i}
            cx={(parseFloat(orb.cx) / 100) * width}
            cy={(parseFloat(orb.cy) / 100) * height}
            rx={(parseFloat(orb.rx) / 100) * width}
            ry={(parseFloat(orb.ry) / 100) * height}
            fill={`url(#glow${i})`}
          />
        ))}
      </Svg>
    </View>
  );
};

export const AuthBackground = memo(AuthBackgroundComponent);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: authGlow.base,
    overflow: 'hidden',
  },
});
