import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@theme';

/**
 * Legal notice slot at the bottom of every auth screen.
 *
 * Currently empty — the age-gate copy was removed. Kept as a component so the
 * three auth screens keep a single place to put the notice back.
 */
const AuthLegalComponent = () => <View style={styles.row} />;

export const AuthLegal = memo(AuthLegalComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
