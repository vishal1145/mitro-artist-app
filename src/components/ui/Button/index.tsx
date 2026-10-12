import { Feather } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { GradientButton } from '@components/ui/GradientButton';
import { Text } from '@components/ui/Text';
import { colors, radius, size, spacing, HIT_TARGET } from '@theme';
import { rf } from '@utils/responsive';

import type { ButtonProps, ButtonVariant } from './types';

const VARIANT_TEXT: Record<Exclude<ButtonVariant, 'primary'>, keyof typeof colors> = {
  secondary: 'textPrimary',
  ghost: 'pink',
  plain: 'textPrimary',
  danger: 'white',
};

const HEIGHT = { sm: HIT_TARGET, md: size.cta, lg: 52 } as const;

/**
 * Every button in the app. `primary` is the brand gradient; `secondary` is the
 * web's outlined surface button; `ghost` is a quiet text button; `danger` is
 * destructive. Same height, radius and type on every screen.
 */
const ButtonComponent = ({
  label,
  variant = 'primary',
  size: buttonSize = 'md',
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

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (isInactive) {
        return;
      }
      onPress?.(event);
    },
    [isInactive, onPress],
  );

  if (variant === 'primary') {
    return (
      <GradientButton
        label={label}
        size={buttonSize === 'lg' ? 'lg' : 'md'}
        fullWidth={fullWidth}
        loading={loading}
        disabled={disabled}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        style={style}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        {...rest}
      />
    );
  }

  const textColor = VARIANT_TEXT[variant];

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
        { height: HEIGHT[buttonSize], alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        variant === 'secondary' ? styles.secondary : null,
        variant === 'danger' ? styles.danger : null,
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
            <Feather name={leftIcon} size={rf(18)} color={colors[textColor]} style={styles.leftIcon} />
          ) : null}
          <Text variant="button" color={textColor} numberOfLines={1}>
            {label}
          </Text>
          {rightIcon ? (
            <Feather name={rightIcon} size={rf(18)} color={colors[textColor]} style={styles.rightIcon} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

export const Button = memo(ButtonComponent);

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HIT_TARGET,
    backgroundColor: colors.transparent,
  },
  // Web .dv2-btn: surface-soft fill, 1px border.
  secondary: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.error,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
