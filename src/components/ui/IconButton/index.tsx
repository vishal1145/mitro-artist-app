import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

export type IconButtonTone = 'neutral' | 'primary' | 'danger';

export interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  /** Caption under the circle. */
  label?: string;
  tone?: IconButtonTone;
  /** Diameter of the circle in pt (min 44). */
  diameter?: number;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Round icon action with an optional caption. The only round button in the
 * app: Mic / Camera / Flip on Live, quick actions on Home, etc.
 */
const IconButtonComponent = ({
  icon,
  label,
  tone = 'neutral',
  diameter = 50,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
}: IconButtonProps) => {
  const iconColor =
    tone === 'primary' ? colors.background : tone === 'danger' ? colors.spend : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.col,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View
        style={[
          styles.circle,
          { width: Math.max(44, diameter), height: Math.max(44, diameter) },
          tone === 'primary' ? styles.primary : null,
          tone === 'danger' ? styles.danger : null,
        ]}
      >
        <Feather name={icon} size={rf(18)} color={iconColor} />
      </View>
      {label ? (
        <Text variant="caption" color="textSecondary" align="center" numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
};

export const IconButton = memo(IconButtonComponent);

const styles = StyleSheet.create({
  col: { alignItems: 'center', gap: spacing.xxs, minWidth: 56 },
  circle: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.white, borderColor: colors.white },
  danger: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
