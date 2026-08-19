import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius } from '@theme';

export interface HeroCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hero panel — solid heroIndigo, radius 20, no gradient.
 * Used for the standout block at the top of a screen.
 */
const HeroCardComponent = ({ children, style }: HeroCardProps) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const HeroCard = memo(HeroCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.heroIndigo,
    borderRadius: radius.card,
    padding: layout.cardPadding,
  },
});
