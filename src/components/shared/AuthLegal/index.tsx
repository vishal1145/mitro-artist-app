import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, spacing } from '@theme';
import { rf } from '@utils/responsive';

/** Age-gate notice pinned to the bottom of every auth screen. */
const AuthLegalComponent = () => (
  <View style={styles.row}>
    <Ionicons
      name="shield-outline"
      size={rf(14)}
      color={colors.textMuted}
      style={styles.icon}
    />
    <Text variant="bodySm" color="textMuted" style={styles.text}>
      Mitro is an entertainment platform for adult audiences. By continuing, you confirm that you
      are 18 years or older.
    </Text>
  </View>
);

export const AuthLegal = memo(AuthLegalComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  icon: {
    marginTop: rf(2),
  },
  text: {
    flex: 1,
  },
});
