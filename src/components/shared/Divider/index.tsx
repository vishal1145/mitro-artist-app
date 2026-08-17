import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, spacing } from '@theme';

export interface DividerProps {
  /** Optional centered label (e.g. "OR CONNECT"). */
  label?: string;
}

/** Horizontal rule, optionally with a centered, letter-spaced label. */
const DividerComponent = ({ label }: DividerProps) => {
  if (!label) {
    return <View style={styles.line} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.flexLine} />
      <Text variant="label" color="textMuted" style={styles.label}>
        {label}
      </Text>
      <View style={styles.flexLine} />
    </View>
  );
};

export const Divider = memo(DividerComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  flexLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  label: {
    marginHorizontal: spacing.md,
    letterSpacing: 1.5,
  },
});
