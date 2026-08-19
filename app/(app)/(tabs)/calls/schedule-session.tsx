import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Header, Screen, SegmentedControl, ToggleRow } from '@components/shared';
import { Card, GradientButton, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface FieldProps {
  label: string;
  icon?: IoniconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  containerStyle?: object;
}

const Field = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', containerStyle }: FieldProps) => (
  <View style={[styles.field, containerStyle]}>
    <Text variant="body" color="textSecondary">
      {label}
    </Text>
    <View style={styles.inputRow}>
      {icon ? <Ionicons name={icon} size={rf(16)} color={colors.textMuted} /> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={colors.inputPlaceholder}
        style={styles.input}
      />
    </View>
  </View>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Text variant="label" color="textMuted" style={styles.sectionLabel}>
    {children}
  </Text>
);

const ScheduleSessionScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60 min');
  const [seats, setSeats] = useState('10');
  const [price, setPrice] = useState('500');
  const [requireApproval, setRequireApproval] = useState(true);

  const potential = useMemo(() => {
    const s = parseInt(seats, 10) || 0;
    const p = parseInt(price, 10) || 0;
    return (s * p).toLocaleString('en-US');
  }, [seats, price]);

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      <Header title="Broadcast Session" onBack={() => router.back()} />

      <SectionLabel>SESSION DETAILS</SectionLabel>
      <Card style={styles.section}>
        <Field label="Session Title" icon="text-outline" value={title} onChangeText={setTitle} placeholder="e.g., Mixing Masterclass: Vocals" />
        <View style={styles.row}>
          <Field label="Date" icon="calendar-outline" value={date} onChangeText={setDate} placeholder="mm/dd/yyyy" containerStyle={styles.flex} />
          <Field label="Time" icon="time-outline" value={time} onChangeText={setTime} placeholder="--:-- --" containerStyle={styles.flex} />
        </View>
        <View style={styles.field}>
          <Text variant="body" color="textSecondary">
            Duration
          </Text>
          <SegmentedControl options={['30 min', '60 min', '90 min']} value={duration} onChange={setDuration} />
        </View>
      </Card>

      <SectionLabel>ACCESS &amp; PRICING</SectionLabel>
      <Card style={styles.section}>
        <View style={styles.row}>
          <Field label="Available Seats" icon="people-outline" value={seats} onChangeText={setSeats} keyboardType="number-pad" containerStyle={styles.flex} />
          <Field label="Price per Seat (tk)" icon="ticket-outline" value={price} onChangeText={setPrice} keyboardType="number-pad" containerStyle={styles.flex} />
        </View>
        <View style={styles.divider} />
        <ToggleRow
          label="Require Approval"
          description="Review attendees before they join"
          value={requireApproval}
          onValueChange={setRequireApproval}
        />
      </Card>

      {/* Potential earnings */}
      <View style={styles.potential}>
        <Text variant="label" color="warning" style={styles.potentialLabel}>
          POTENTIAL EARNINGS
        </Text>
        <View style={styles.potentialRow}>
          <Text variant="body" color="textSecondary">
            If every seat fills{'  '}
          </Text>
          <Ionicons name="ticket-outline" size={rf(18)} color={colors.warning} />
          <Text variant="display" style={styles.potentialValue}>
            {' '}
            {potential}
          </Text>
        </View>
        <Text variant="caption" color="textMuted">
          ({seats || 0} × {price || 0})
        </Text>
      </View>

      <GradientButton
        label="Schedule Session"
        gradient="primary"
        textColor="ctaDark"
        leftIcon="flash"
        onPress={() => router.replace('/(app)/(tabs)/calls/group-call-history')}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(14),
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  potential: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  potentialLabel: {
    letterSpacing: 1.1,
  },
  potentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  potentialValue: {
    fontSize: rf(30),
  },
});

export default ScheduleSessionScreen;
