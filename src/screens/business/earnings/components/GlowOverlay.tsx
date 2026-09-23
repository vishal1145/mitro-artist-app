import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/* -------------------------------------------------------------------------- */
/* GlowOverlay — the two radial glows the web layers over the dark base of the  */
/* .hero-card and .source-pie-card (purple top-left, pink bottom-right).        */
/* -------------------------------------------------------------------------- */

export const GlowOverlay = () => {
  // Radial gradients in react-native-svg only render smoothly with explicit
  // pixel coordinates (userSpaceOnUse); bounding-box fractions produce a hard
  // rectangular edge. So measure the card, then place the two glows in px:
  // purple top-left, pink bottom-right, each fading fully to transparent.
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <RadialGradient
              id="glowPurple"
              cx={size.w * 0.18}
              cy={0}
              rx={size.w * 0.85}
              ry={size.h * 0.95}
              fx={size.w * 0.18}
              fy={0}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#8c4dff" stopOpacity={0.34} />
              <Stop offset="1" stopColor="#8c4dff" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="glowPink"
              cx={size.w * 0.88}
              cy={size.h}
              rx={size.w * 0.82}
              ry={size.h * 0.9}
              fx={size.w * 0.88}
              fy={size.h}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#ff3fad" stopOpacity={0.24} />
              <Stop offset="1" stopColor="#ff3fad" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#glowPurple)" />
          <Rect width={size.w} height={size.h} fill="url(#glowPink)" />
        </Svg>
      ) : null}
    </View>
  );
};
