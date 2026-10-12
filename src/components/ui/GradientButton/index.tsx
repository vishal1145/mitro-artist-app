import { Feather } from '@expo/vector-icons';
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

// CTA gradient runs 135deg like the web's --color-primary-gradient.
const GRADIENT_START = gradientDirection.diagonal.start;
const GRADIENT_END = gradientDirection.diagonal.end;

const HEIGHT = { md: size.cta, lg: 52 } as const;

/**
 * THE primary action button for the whole app (Go Live, Start Live, Schedule
 * Session, Turn on, Save…). Same height, radius, type and gradient everywhere;
 * screens must not hand-build their own gradient buttons.
 */
const GradientButtonComponent = ({
  label,
  gradient = 'primary',
  textColor = 'onPrimary',
  size: buttonSize = 'md',
  fullWidth = true,
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
  const stops = gradients[gradient];
  const tint = colors[textColor];

  const wrapperStyle = useMemo<ViewStyle>(
    () => ({
      shadowColor: gradientGlow[gradient],
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    }),
    [gradient, fullWidth],
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
        wrapperStyle,
        pressed && !isInactive ? styles.pressed : null,
        isInactive ? styles.inactive : null,
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={stops}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={[styles.fill, { height: HEIGHT[buttonSize] }]}
      >
        {loading ? (
          <ActivityIndicator color={tint} />
        ) : (
          <View style={styles.content}>
            {leftIcon ? (
              <Feather name={leftIcon} size={rf(18)} color={tint} style={styles.leftIcon} />
            ) : null}
            <Text variant="button" color={textColor} numberOfLines={1}>
              {label}
            </Text>
            {rightIcon ? (
              <Feather name={rightIcon} size={rf(18)} color={tint} style={styles.rightIcon} />
            ) : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export const GradientButton = memo(GradientButtonComponent);

const styles = StyleSheet.create({
  // Web: radius-base (8), no resting shadow (depth = surface steps + borders).
  wrapper: {
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
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
