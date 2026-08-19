import type { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Visible field label. Optional — when omitted, the field is placeholder-only
   * (still accessible via `accessibilityLabel` / placeholder).
   */
  label?: string;
  /** Node rendered at the right of the label row (e.g. a "Forgot?" link). */
  labelRight?: ReactNode;
  /** Error copy shown below the field. Presence toggles the error state. */
  error?: string;
  /** Helper/hint text shown when there is no error. */
  hint?: string;
  /** Renders a show/hide toggle and secures entry. */
  isPassword?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Static text before the field, separated by a rule (e.g. a "+91" dial code). */
  prefix?: string;
  disabled?: boolean;
  /** Shows a live character counter (requires maxLength). */
  showCounter?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the native input for screen readers. */
  accessibilityHint?: string;
}
