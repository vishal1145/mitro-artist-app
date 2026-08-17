import { memo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@theme';
import { wp } from '@utils/responsive';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** Surface container. Becomes a pressable when `onPress` is provided. */
const CardComponent = ({
  children,
  onPress,
  elevated = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) => {
  const content = (
    <View
      style={[styles.card, elevated ? styles.elevated : null, style]}
    >
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {content}
    </Pressable>
  );
};

export const Card = memo(CardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: wp(0.25),
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
  pressed: {
    opacity: 0.9,
  },
});
