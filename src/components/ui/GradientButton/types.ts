import { Ionicons } from '@expo/vector-icons';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

import type { ColorToken, GradientToken } from '@theme';

export interface GradientButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  /** Which theme gradient to fill with. */
  gradient?: GradientToken;
  /** Label/icon color token (defaults to white for bright gradients). */
  textColor?: ColorToken;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
