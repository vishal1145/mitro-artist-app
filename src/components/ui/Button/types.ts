import type { Feather } from '@expo/vector-icons';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
  /** Overrides the auto-generated accessibility label. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
