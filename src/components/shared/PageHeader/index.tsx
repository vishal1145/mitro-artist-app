import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors } from '@theme';
import { rf } from '@utils/responsive';

export interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  /** Trailing slot — a pill button, help chip, etc. */
  right?: ReactNode;
}

/**
 * Pushed-screen header: circular back button, left-aligned title, optional
 * trailing action. Distinct from `Header`, which centres its title.
 */
const PageHeaderComponent = ({ title, onBack, right }: PageHeaderProps) => (
  <View style={styles.row}>
    {onBack ? (
      <Pressable
        onPress={onBack}
        style={styles.back}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={rf(20)} color={colors.textPrimary} />
      </Pressable>
    ) : null}

    <Text variant="h2" style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    {right}
  </View>
);

export const PageHeader = memo(PageHeaderComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
