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
  // Spec: surface fill, 1px border, radius 14-18, 20-22 top/sides and 18 bottom.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingTop: layout.cardPadding,
    paddingHorizontal: layout.cardPadding,
    paddingBottom: layout.cardPaddingBottom,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surfaceStrong,
  },
  pressed: {
    opacity: 0.9,
  },
});
