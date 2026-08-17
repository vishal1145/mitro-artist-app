import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing, HIT_TARGET } from '@theme';
import { rf, wp } from '@utils/responsive';

export type SocialProvider = 'google' | 'apple';

export interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const CONFIG: Record<
  SocialProvider,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  google: { label: 'Google', icon: 'logo-google' },
  apple: { label: 'Apple', icon: 'logo-apple' },
};

/** Outlined third-party auth button ("OR CONNECT" row). */
const SocialButtonComponent = ({
  provider,
  onPress,
  disabled = false,
  style,
}: SocialButtonProps) => {
  const { label, icon } = CONFIG[provider];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${label}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={rf(20)}
        color={colors.textPrimary}
        style={styles.icon}
      />
      <Text variant="body" color="textPrimary">
        {label}
      </Text>
    </Pressable>
  );
};

export const SocialButton = memo(SocialButtonComponent);

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HIT_TARGET + wp(2),
    borderRadius: radius.md,
    borderWidth: wp(0.3),
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
