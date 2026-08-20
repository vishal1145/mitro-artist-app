import { Feather } from '@expo/vector-icons';
import { memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing, HIT_TARGET } from '@theme';
import { rf, wp } from '@utils/responsive';

import type { ButtonProps, ButtonSize, ButtonVariant } from './types';

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surfaceElevated,
  ghost: colors.transparent,
  danger: colors.error,
};

const VARIANT_TEXT: Record<ButtonVariant, keyof typeof colors> = {
  primary: 'onPrimary',
  secondary: 'textPrimary',
  ghost: 'primary',
  danger: 'white',
};

const SIZE_HEIGHT: Record<ButtonSize, number> = {
  sm: HIT_TARGET,
  md: 52,
  lg: 58,
};

/**
 * Accessible, tokenized button. Handles loading + disabled visual states,
 * optional icons, and a guaranteed 44pt minimum touch target.
 */
const ButtonComponent = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: ButtonProps) => {
  const isInactive = disabled || loading;
  const textColor = VARIANT_TEXT[variant];

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      height: SIZE_HEIGHT[size],
      backgroundColor: VARIANT_BG[variant],
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    }),
    [size, variant, fullWidth],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (isInactive) {
        return;
      }
      onPress?.(event);
    },
    [isInactive, onPress],
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        variant === 'ghost' ? styles.ghostBorder : null,
        pressed && !isInactive ? styles.pressed : null,
        isInactive ? styles.inactive : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[textColor]} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? (
            <Feather
              name={leftIcon}
              size={rf(18)}
              color={colors[textColor]}
              style={styles.leftIcon}
            />
          ) : null}
          <Text variant="button" color={textColor}>
            {label}
          </Text>
          {rightIcon ? (
            <Feather
              name={rightIcon}
              size={rf(18)}
              color={colors[textColor]}
              style={styles.rightIcon}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

export const Button = memo(ButtonComponent);

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HIT_TARGET,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBorder: {
    borderWidth: wp(0.3),
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  inactive: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
});
