import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { Header, Screen, SegmentedControl, ToggleRow } from '@components/shared';
import { Card, GradientButton, Text } from '@components/ui';
import { groupCallApi } from '@services/api/groupCallApi';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface FieldProps {
  label: string;
  icon?: FeatherIconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
  hint?: string;
  containerStyle?: object;
}

const Field = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', multiline, hint, containerStyle }: FieldProps) => (
  <View style={[styles.field, containerStyle]}>
    <Text variant="label" color="textMuted">{label}</Text>
    <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
      {icon ? <Feather name={icon} size={rf(15)} color={colors.textMuted} /> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={colors.inputPlaceholder}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {hint ? <Text variant="caption" color="textMuted">{hint}</Text> : null}
  </View>
);

const ScheduleSessionScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [seats, setSeats] = useState('5');
  const [tokenPrice, setTokenPrice] = useState('8');
  const [highlightedPrice, setHighlightedPrice] = useState('');
  const [refundThreshold, setRefundThreshold] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'Video call' | 'Audio only'>('Video call');
  const [requireApproval, setRequireApproval] = useState(false);
  const [creating, setCreating] = useState(false);

  const seatsNum = parseInt(seats, 10) || 0;
  const priceNum = parseInt(tokenPrice, 10) || 0;
  const potential = useMemo(() => (seatsNum * priceNum).toLocaleString('en-US'), [seatsNum, priceNum]);
  const canSchedule = title.trim().length > 0 && seatsNum > 0 && priceNum >= 0;

  const schedule = async () => {
    if (!canSchedule || creating) return;
    setCreating(true);
    const res = await groupCallApi.create({
      title: title.trim(),
      description: description.trim() || undefined,
      maxParticipants: seatsNum,
      entryPrice: priceNum,
      requiresApproval: requireApproval,
      audioOrVideoMode: mode === 'Audio only' ? 'audio' : 'video',
      expectedDurationMinutes: parseInt(duration, 10) || undefined,
    });
    setCreating(false);
    if (!res.success) {
      Alert.alert("Couldn't schedule", res.error);
      return;
    }
    // Land straight in the group-call studio, which starts + manages the room.
    router.replace({
      pathname: '/(app)/(modals)/group-call-room',
      params: {
        groupCallId: res.data.groupCallId,
        sessionConfig: JSON.stringify({
          title: title.trim(),
          maxParticipants: seatsNum,
          entryPrice: priceNum,
          requiresApproval: requireApproval,
          mode: mode === 'Audio only' ? 'audio' : 'video',
        }),
      },
    });
  };

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      <Header title="Schedule Group Session" onBack={() => router.back()} />

      <View style={styles.eyebrowRow}>
        <Feather name="video" size={rf(12)} color={colors.pink} />
        <Text variant="label" color="pink">GROUP CALL</Text>
      </View>

      <Card style={styles.section}>
        <Text variant="h3" color="textPrimary">Create a paid group session</Text>
        <Text variant="bodySm" color="textSecondary" style={styles.intro}>
          Set the seats, topic, and token price — fans pay to join and everyone shares the room.
        </Text>

        <Field label="SESSION TITLE" icon="type" value={title} onChangeText={setTitle} placeholder="e.g. Late Night Q&A" />

        <View style={styles.field}>
          <Text variant="label" color="textMuted">EXPECTED DURATION (MIN)</Text>
          <SegmentedControl options={['30', '60', '90']} value={duration} onChange={setDuration} />
          <Text variant="caption" color="textMuted">Used for the refund threshold default in the studio.</Text>
        </View>

        <View style={styles.row}>
          <Field label="AVAILABLE SEATS" icon="users" value={seats} onChangeText={setSeats} keyboardType="number-pad" hint="Max people in the room." containerStyle={styles.flex} />
          <Field label="TOKEN PRICE" icon="tag" value={tokenPrice} onChangeText={setTokenPrice} keyboardType="number-pad" hint="One-time price per seat." containerStyle={styles.flex} />
        </View>

        <View style={styles.row}>
          <Field label="HIGHLIGHTED MESSAGE PRICE" value={highlightedPrice} onChangeText={setHighlightedPrice} keyboardType="number-pad" placeholder="e.g. 100" hint="What a participant pays to pin a message." containerStyle={styles.flex} />
          <Field label="REFUND THRESHOLD" value={refundThreshold} onChangeText={setRefundThreshold} keyboardType="number-pad" placeholder="e.g. 2" hint="Minutes before refunds stop." containerStyle={styles.flex} />
        </View>

        <Field label="SESSION DESCRIPTION (OPTIONAL)" value={description} onChangeText={setDescription} placeholder="What's this session about?" multiline />

        <View style={styles.field}>
          <Text variant="label" color="textMuted">CALL MODE</Text>
          <SegmentedControl options={['Video call', 'Audio only']} value={mode} onChange={(v) => setMode(v as 'Video call' | 'Audio only')} />
          <Text variant="caption" color="textMuted">Audio-only uses less bandwidth — good for talk-focused sessions.</Text>
        </View>

        <View style={styles.divider} />
        <ToggleRow
          label="Require my approval before someone can join"
          description="Off = fans join instantly up to your seat limit. On = they wait in a queue you approve one by one."
          value={requireApproval}
          onValueChange={setRequireApproval}
        />
      </Card>

      {/* If every seat fills */}
      <View style={styles.potential}>
        <Text variant="bodyLg" color="textPrimary" style={styles.bold}>If every seat fills</Text>
        <View style={styles.potentialRow}>
          <Text variant="body" color="textSecondary">Seats × price</Text>
          <Text variant="h3" color="gold" style={styles.potentialValue}>{potential} tk</Text>
        </View>
        <View style={styles.potentialRow}>
          <Text variant="body" color="textSecondary">Price per seat (one-time)</Text>
          <Text variant="h3" color="gold" style={styles.potentialValue}>{priceNum} tk</Text>
        </View>
      </View>

      <GradientButton
        label={creating ? 'Scheduling…' : 'Schedule Session'}
        gradient="primary"
        textColor="ctaDark"
        leftIcon="video"
        disabled={!canSchedule || creating}
        onPress={schedule}
      />
      <Text variant="caption" color="textMuted" style={styles.footNote}>
        You&apos;ll land in the group call studio next, where you actually start and manage the room.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, gap: spacing.md },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { marginTop: spacing.xs },
  section: { gap: spacing.md },
  intro: { marginTop: -4, lineHeight: rf(18) },
  field: { gap: spacing.xs },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.inputBackground, borderRadius: radius.md, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: spacing.md },
  inputRowMultiline: { alignItems: 'flex-start', minHeight: 70, paddingVertical: spacing.sm },
  input: { flex: 1, color: colors.textPrimary, fontFamily: fontFamily.body, fontSize: rf(13), paddingVertical: spacing.sm },
  inputMultiline: { minHeight: 56, paddingVertical: 0 },
  divider: { height: 1, backgroundColor: colors.border },
  bold: { fontFamily: fontFamily.bold },
  potential: { backgroundColor: colors.warningSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.warningBorder, padding: spacing.md, gap: spacing.xs, marginTop: spacing.sm },
  potentialRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  potentialValue: { fontFamily: fontFamily.extrabold },
  footNote: { textAlign: 'center', marginTop: spacing.xs },
});

export default ScheduleSessionScreen;
