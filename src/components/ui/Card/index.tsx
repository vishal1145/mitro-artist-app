import { memo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, layout, radius } from '@theme';

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
  // Spec: card fill, 1px border, radius 20, padding 18.
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.cardRaised,
  },
  pressed: {
    opacity: 0.9,
  },
});
