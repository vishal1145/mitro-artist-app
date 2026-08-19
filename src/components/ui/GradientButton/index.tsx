import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import {
  colors,
  gradientDirection,
  gradientGlow,
  gradients,
  radius,
  size,
  spacing,
  HIT_TARGET,
} from '@theme';
import { rf } from '@utils/responsive';

import type { GradientButtonProps } from './types';

// CTA gradient runs 90deg — left to right.
const GRADIENT_START = gradientDirection.horizontal.start;
const GRADIENT_END = gradientDirection.horizontal.end;

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

  const glowStyle = useMemo<ViewStyle>(
    () => ({ shadowColor: gradientGlow[gradient] }),
    [gradient],
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
        styles.wrapper,
        glowStyle,
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
  // Spec: full width, height 56, radius 18, shadow 0 12px 30px pink/35.
  wrapper: {
    borderRadius: radius.button,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1, // alpha is already baked into the rgba glow color
    shadowRadius: 30,
    elevation: 12,
  },
  fill: {
    height: size.cta,
    borderRadius: radius.button,
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
