import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { HelpIcon } from '@components/history';
import { Text } from '@components/ui';
import { typography } from '@theme';

import { web } from '../webTokens';

/* -------------------------------------------------------------------------- */
/*  .gsched-label / .gsched-hint / .gsched-field                               */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  label: string;
  /** Renders the lowercase `<i>(optional)</i>` suffix the web label uses. */
  optional?: boolean;
  /** The web's `.gsched-help` `title` text. Renders a tappable question mark. */
  help?: string;
  hint?: string;
  children: ReactNode;
}

const FieldComponent = ({ label, optional, help, hint, children }: FieldProps) => (
  <View style={styles.field}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {optional ? <Text style={styles.labelOptional}>(optional)</Text> : null}
      {help ? <HelpIcon hint={help} size={13} /> : null}
    </View>
    {children}
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

export const Field = memo(FieldComponent);
Field.displayName = 'Field';

/* .gsched-field */
const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    ...typography.label,
    color: web.textSoft,
  },
  labelOptional: {
    ...typography.label,
    color: web.hint,
  },
  /* .gsched-hint */
  hint: {
    ...typography.bodySm,
    color: web.hint,
  },
});
