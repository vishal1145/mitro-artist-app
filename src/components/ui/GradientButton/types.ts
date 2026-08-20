import type { Feather } from '@expo/vector-icons';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

import type { ColorToken, CtaGradientToken } from '@theme';

/**
 * Gradients usable on a button — only those with a matching glow token.
 * Decorative fills (brand, hero, scrim, glassHighlight) are excluded.
 */
export type ButtonGradientToken = CtaGradientToken;

export interface GradientButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  /** Which theme gradient to fill with. */
  gradient?: ButtonGradientToken;
  /** Label/icon color token (defaults to white for bright gradients). */
  textColor?: ColorToken;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
