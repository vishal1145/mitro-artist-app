import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@components/ui';
import { colors } from '@theme';
import { rf } from '@utils/responsive';

export interface ActionRowProps {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

export const ActionRow = ({ icon, label, destructive, onPress }: ActionRowProps) => (
  <Pressable style={styles.actionRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
    <Feather name={icon} size={rf(18)} color={destructive ? colors.pink : colors.textPrimary} />
    <Text variant="bodyLg" color={destructive ? 'pink' : 'textPrimary'}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 12,
  },
});
