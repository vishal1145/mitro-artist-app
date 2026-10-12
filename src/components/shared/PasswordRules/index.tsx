import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { colors } from '@theme';

export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Contains a number', test: (v: string) => /\d/.test(v) },
  { label: 'Contains an uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
] as const;

/** Live checklist shown under the password field (same rules/text as the User app). */
export const PasswordRules = ({ password }: { password: string }) => (
  <View style={styles.list}>
    {PASSWORD_RULES.map((rule) => {
      const ok = rule.test(password);
      return (
        <View key={rule.label} style={styles.row}>
          <Feather
            name={ok ? 'check' : 'x'}
            size={13}
            color={ok ? colors.green : colors.textSecondary}
          />
          <Text variant="bodySm" color={ok ? 'success' : 'textSecondary'}>
            {rule.label}
          </Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  list: {
    marginTop: 8,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
