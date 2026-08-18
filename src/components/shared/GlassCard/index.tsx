import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients, radius } from '@theme';

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Transparent -> primary/35 -> transparent, matching the Figma top highlight.
const HIGHLIGHT_COLORS = gradients.glassHighlight;
const HIGHLIGHT_START = { x: 0, y: 0 };
const HIGHLIGHT_END = { x: 1, y: 0 };

/**
 * Frosted-glass auth card — matches the Figma reference exactly:
 * translucent blurred surface, no hard border, with a 1px gradient
 * highlight along the top edge. Built on expo-blur (Expo Go compatible).
 */
const GlassCardComponent = ({ children, style }: GlassCardProps) => {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tintOverlay} />
      <LinearGradient
        colors={HIGHLIGHT_COLORS}
        start={HIGHLIGHT_START}
        end={HIGHLIGHT_END}
        style={styles.highlight}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export const GlassCard = memo(GlassCardComponent);

const styles = StyleSheet.create({
  wrapper: {
    // Borderless — the blur + tint alone separate the card from the backdrop.
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glassSurface,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  content: {
    position: 'relative',
  },
});
