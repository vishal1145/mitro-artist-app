import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { GoogleGlyph } from '@components/ui/GoogleGlyph';
import { Text } from '@components/ui/Text';
import { colors, spacing, HIT_TARGET } from '@theme';
import { rf } from '@utils/responsive';

export type SocialProvider = 'google' | 'apple';

export interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LABEL: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple',
};

/**
 * "OR CONNECT" provider button — bordered pill, icon + label horizontal,
 * centered. Intended to be used with `style={{ flex: 1 }}` so two buttons
 * split the row evenly.
 */
const SocialButtonComponent = ({
  provider,
  onPress,
  disabled = false,
  style,
}: SocialButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Continue with ${LABEL[provider]}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {provider === 'google' ? (
        <GoogleGlyph size={rf(20)} />
      ) : (
        <Ionicons name="logo-apple" size={rf(20)} color={colors.textPrimary} />
      )}
      <Text variant="body" color="textPrimary">
        {LABEL[provider]}
      </Text>
    </Pressable>
  );
};

export const SocialButton = memo(SocialButtonComponent);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HIT_TARGET, // 44 — plain touch target, no box
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
