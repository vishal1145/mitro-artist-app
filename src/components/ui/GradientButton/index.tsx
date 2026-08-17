import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, gradients, radius, spacing, HIT_TARGET } from '@theme';
import { rf, wp } from '@utils/responsive';

import type { GradientButtonProps } from './types';

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 0 };

/**
 * Primary call-to-action with a gradient fill and soft glow (matches the
 * Mitro "Go Live" / "Create Account" buttons). Handles loading + disabled.
 */
const GradientButtonComponent = ({
  label,
  gradient = 'primary',
  textColor = 'onPrimary',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: GradientButtonProps) => {
  const isInactive = disabled || loading;
  const [gradientStart, gradientEnd] = gradients[gradient];
  const tint = colors[textColor];

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
        styles.wrapper,
        pressed && !isInactive ? styles.pressed : null,
        isInactive ? styles.inactive : null,
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.fill}
      >
        {loading ? (
          <ActivityIndicator color={tint} />
        ) : (
          <View style={styles.content}>
            {leftIcon ? (
              <Ionicons
                name={leftIcon}
                size={rf(18)}
                color={tint}
                style={styles.leftIcon}
              />
            ) : null}
            <Text variant="button" color={textColor}>
              {label}
            </Text>
            {rightIcon ? (
              <Ionicons
                name={rightIcon}
                size={rf(18)}
                color={tint}
                style={styles.rightIcon}
              />
            ) : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export const GradientButton = memo(GradientButtonComponent);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    // Soft glow
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: wp(4),
    elevation: 12,
  },
  fill: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: HIT_TARGET,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.92,
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
