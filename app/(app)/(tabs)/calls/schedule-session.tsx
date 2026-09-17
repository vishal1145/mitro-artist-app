import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { HelpIcon } from '@components/history';
import { PageHeader, Screen } from '@components/shared';
import { Text } from '@components/ui';
import { groupCallApi } from '@services/api/groupCallApi';
import { activeGroupCallStore } from '@services/groupCall/activeGroupCall';
import { layout, typography } from '@theme';
import { showToast } from '@utils/toast';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

/**
 * Palette + geometry lifted verbatim from the artist web's `.gsched-*` /
 * `.gcall-mode-*` rules (Mitro.Artist.UI/src/styles.css) so this screen is the
 * mobile-responsive web page, not an approximation of it.
 */
const web = {
  textStrong: '#FFFAFF',
  textSoft: 'rgba(255, 250, 255, 0.72)',
  hint: 'rgba(255, 255, 255, 0.4)',
  help: 'rgba(255, 255, 255, 0.35)',
  eyebrow: '#FF8FC7',
  backBg: 'rgba(255, 255, 255, 0.06)',
  backBorder: 'rgba(255, 255, 255, 0.14)',
  cardBase: 'rgba(12, 10, 25, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.13)',
  sideBase: 'rgba(12, 10, 25, 0.7)',
  inputBg: 'rgba(5, 4, 11, 0.6)',
  inputBorder: 'rgba(255, 255, 255, 0.14)',
  placeholder: 'rgba(255, 255, 255, 0.32)',
  modeIdleBg: 'rgba(255, 255, 255, 0.04)',
  modeIdleBorder: 'rgba(255, 255, 255, 0.12)',
  approvalBg: 'rgba(255, 255, 255, 0.03)',
  approvalBorder: 'rgba(255, 255, 255, 0.1)',
  switchTrack: 'rgba(255, 255, 255, 0.16)',
  checkIdleText: 'rgba(255, 255, 255, 0.45)',
  checkIdleIcon: 'rgba(255, 255, 255, 0.25)',
  green: '#42F5A7',
  gold: '#FFC86B',
  mathBorder: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000000',
  pinkGlow: 'rgba(255, 63, 173, 0.3)',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

/** linear-gradient(135deg, #ff3fad, #8c4dff) */
const HOT_STOPS = ['#FF3FAD', '#8C4DFF'] as const;
/** linear-gradient(145deg, rgba(255,255,255,.095), rgba(255,255,255,.035)) */
const CARD_SHEEN = ['rgba(255, 255, 255, 0.095)', 'rgba(255, 255, 255, 0.035)'] as const;
/** linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.02)) */
const SIDE_SHEEN = ['rgba(255, 255, 255, 0.075)', 'rgba(255, 255, 255, 0.02)'] as const;

const DIAG_START = { x: 0, y: 0 };
const DIAG_END = { x: 1, y: 1 };
/** 145deg — steeper than the corner-to-corner diagonal. */
const SHEEN_END = { x: 0.7, y: 1 };

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Digits -> `HH:MM`, mirroring what `<input type="time">` accepts. */
const maskTime = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const normalizeTime = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 3) {
    return '';
  }
  const padded = digits.padStart(4, '0');
  const hours = Math.min(23, parseInt(padded.slice(0, 2), 10));
  const minutes = Math.min(59, parseInt(padded.slice(2, 4), 10));
  return `${pad2(hours)}:${pad2(minutes)}`;
};

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

const Field = memo(({ label, optional, help, hint, children }: FieldProps) => (
  <View style={styles.field}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {optional ? <Text style={styles.labelOptional}>(optional)</Text> : null}
      {help ? <HelpIcon hint={help} size={13} /> : null}
    </View>
    {children}
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
));
Field.displayName = 'Field';

interface BoxInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
}

const BoxInput = memo(({ value, onChangeText, placeholder, numeric, multiline }: BoxInputProps) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={web.placeholder}
    keyboardType={numeric ? 'number-pad' : 'default'}
    multiline={multiline}
    textAlignVertical={multiline ? 'top' : 'center'}
    style={[styles.input, styles.inputText, multiline ? styles.inputMultiline : null]}
  />
));
BoxInput.displayName = 'BoxInput';

/* -------------------------------------------------------------------------- */
/*  .gcall-mode-toggle                                                         */
/* -------------------------------------------------------------------------- */

interface ModeButtonProps {
  icon: FeatherIconName;
  label: string;
  active: boolean;
  onPress: () => void;
}

const ModeButton = memo(({ icon, label, active, onPress }: ModeButtonProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected: active }}
    style={[styles.modeBtn, active ? styles.modeBtnActive : styles.modeBtnIdle]}
  >
    {active ? (
      <LinearGradient
        colors={HOT_STOPS}
        start={DIAG_START}
        end={DIAG_END}
        style={StyleSheet.absoluteFill}
      />
    ) : null}
    <Feather name={icon} size={rf(18)} color={active ? web.white : web.textSoft} />
    <Text style={active ? styles.modeTextActive : styles.modeText}>{label}</Text>
  </Pressable>
));
ModeButton.displayName = 'ModeButton';

/* -------------------------------------------------------------------------- */
/*  .gsched-switch                                                             */
/* -------------------------------------------------------------------------- */

interface SwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
}

const GschedSwitch = memo(({ value, onValueChange, accessibilityLabel }: SwitchProps) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    accessibilityRole="switch"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ checked: value }}
    style={styles.switch}
  >
    {value ? (
      <LinearGradient
        colors={HOT_STOPS}
        start={DIAG_START}
        end={DIAG_END}
        style={styles.switchTrackFill}
      />
    ) : (
      <View style={styles.switchTrackOff} />
    )}
    <View style={[styles.switchKnob, value ? styles.switchKnobOn : null]} />
  </Pressable>
));
GschedSwitch.displayName = 'GschedSwitch';

/* -------------------------------------------------------------------------- */
/*  Screen                                                                     */
/* -------------------------------------------------------------------------- */

const ScheduleSessionScreen = () => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [seats, setSeats] = useState('5');
  const [coinPrice, setCoinPrice] = useState('8');
  const [highlightedPrice, setHighlightedPrice] = useState('');
  const [refundThreshold, setRefundThreshold] = useState('');
  const [mode, setMode] = useState<'video' | 'audio'>('video');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [creating, setCreating] = useState(false);
  /** Blocks the form until we know whether a call is already running. */
  const [checkingActive, setCheckingActive] = useState(true);

  /*
   * The backend allows one group call at a time, and a new one is only
   * possible once the previous one is ended. So if the artist already has a
   * room running (they backed out instead of ending it), don't show them a
   * create form they can't submit — send them straight back into that room,
   * which rejoins it.
   */
  useEffect(() => {
    let cancelled = false;
    activeGroupCallStore.get().then((active) => {
      if (cancelled) return;
      if (active) {
        showToast('You already have a group call running — taking you back to it.', 'info');
        router.replace('/(app)/(modals)/group-call-room');
        return;
      }
      setCheckingActive(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  // The date is locked to today — artists can only pick a time, so there is no
  // separate date state, just a time-of-day today's date gets stitched onto.
  const { todayIso, todayLabel } = useMemo(() => {
    const now = new Date();
    return {
      todayIso: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
      todayLabel: `${pad2(now.getMonth() + 1)}/${pad2(now.getDate())}/${now.getFullYear()}`,
    };
  }, []);

  const seatsNum = parseInt(seats, 10) || 0;
  const priceNum = parseInt(coinPrice, 10) || 0;
  const potential = useMemo(
    () => (seatsNum * priceNum).toLocaleString('en-US'),
    [seatsNum, priceNum],
  );

  const highlightedNum = parseInt(highlightedPrice, 10);
  const refundNum = parseInt(refundThreshold, 10);
  const hasTitle = title.trim().length > 0;
  const hasHighlighted = Number.isFinite(highlightedNum) && highlightedNum > 0;
  const hasRefund = Number.isFinite(refundNum) && refundNum >= 0;

  /*
   * Title, highlighted message price and refund threshold are required before
   * a room can be opened — same three the artist web insists on. The button
   * stays inactive until they're set, and the list below it names what's
   * still missing so the artist isn't left guessing why it won't press.
   */
  const missing = [
    !hasTitle ? 'session title' : null,
    !hasHighlighted ? 'highlighted message price' : null,
    !hasRefund ? 'refund threshold' : null,
  ].filter((v): v is string => v !== null);
  const canSchedule = missing.length === 0 && seatsNum > 0 && priceNum >= 0;

  const checklist = [
    { label: 'Title and topic', done: hasTitle },
    { label: 'Date and time (optional)', done: true },
    { label: 'Seat limit', done: seatsNum > 0 },
    { label: 'Coin price', done: priceNum >= 0 },
    { label: 'Highlighted message price', done: hasHighlighted },
    { label: 'Refund threshold', done: hasRefund },
    { label: 'Approval preference set', done: true },
  ];

  const schedule = async () => {
    if (creating) {
      return;
    }
    if (!title.trim()) {
      showToast('Session title is required.', 'error');
      return;
    }

    const time = normalizeTime(scheduledTime);
    let scheduledStartAtUtc: string | null = null;
    if (time) {
      const startsAt = new Date(`${todayIso}T${time}:00`);
      if (startsAt.getTime() < Date.now()) {
        showToast("Scheduled date and time can't be in the past.", 'error');
        return;
      }
      scheduledStartAtUtc = startsAt.toISOString();
    }

    if (seatsNum <= 0) {
      showToast('Available seats must be greater than 0.', 'error');
      return;
    }
    if (priceNum < 0) {
      showToast('Coin price cannot be negative.', 'error');
      return;
    }
    if (!hasHighlighted) {
      showToast('Highlighted message price is required.', 'error');
      return;
    }
    if (!hasRefund) {
      showToast('Refund threshold is required.', 'error');
      return;
    }

    setCreating(true);
    const res = await groupCallApi.create({
      title: title.trim(),
      description: description.trim() || undefined,
      maxParticipants: seatsNum,
      entryPrice: priceNum,
      requiresApproval,
      audioOrVideoMode: mode,
      scheduledStartAtUtc,
      expectedDurationMinutes: parseInt(duration, 10) || undefined,
    });
    setCreating(false);

    if (!res.success) {
      showToast(res.error, 'error');
      return;
    }

    const groupCallId = res.data.groupCallId;

    // Both are required, so push them before the room opens. A failure here
    // isn't fatal — the call exists and the studio can still run it.
    const [hl, rt] = await Promise.all([
      groupCallApi.setHighlightedMessagePrice(groupCallId, highlightedNum),
      groupCallApi.setRefundThreshold(groupCallId, refundNum),
    ]);
    if (!hl.success || !rt.success) {
      showToast('Session created, but the pin price / refund threshold could not be saved.', 'info');
    }

    // Remember it before we navigate: from here on the artist can back out of
    // the room and walk straight back into it instead of being locked out.
    await activeGroupCallStore.saveDraft({
      groupCallId,
      title: title.trim(),
      maxParticipants: seatsNum,
      entryPrice: priceNum,
      requiresApproval,
      audioOrVideoMode: mode,
    });

    // Land straight in the group-call studio, which starts + manages the room.
    router.replace({
      pathname: '/(app)/(modals)/group-call-room',
      params: {
        groupCallId,
        sessionConfig: JSON.stringify({
          title: title.trim(),
          maxParticipants: seatsNum,
          entryPrice: priceNum,
          requiresApproval,
          mode,
        }),
      },
    });
  };

  if (checkingActive) {
    return (
      <Screen tabBarSpacing contentContainerStyle={styles.checking}>
        <ActivityIndicator size="small" color={web.eyebrow} />
      </Screen>
    );
  }

  return (
    <Screen
      tabBarSpacing
      scrollable
      /* `content` owns the gutter — without this the Screen added its own on
         top of it and this page sat twice as far from the edge. */
      padded={false}
      contentContainerStyle={styles.content}
      header={
        <PageHeader title="Schedule Session" onBack={() => router.back()} />
      }
    >
      {/* .gsched-card */}
      <View style={styles.card}>
        <LinearGradient
          colors={CARD_SHEEN}
          start={DIAG_START}
          end={SHEEN_END}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.cardHead}>
          <Text style={styles.h2}>Create a paid group session</Text>
          <Text style={styles.cardHeadText}>
            Set the date, seats, topic, and coin price — fans pay to join and everyone shares the
            room.
          </Text>
        </View>

        <View style={styles.form}>
          <Field label="Session Title">
            <BoxInput value={title} onChangeText={setTitle} placeholder="e.g. Late Night Q&A" />
          </Field>

          <Field
            label="Date & Time"
            help="Sessions can only be scheduled for today — leave time blank to start on-demand."
            hint="Today only — blank time = starts on-demand, whenever you hit go."
          >
            <View style={styles.split}>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.disabledValue}>{todayLabel}</Text>
              </View>
              <View style={[styles.input, styles.timeBox]}>
                <TextInput
                  value={scheduledTime}
                  onChangeText={(next) => setScheduledTime(maskTime(next))}
                  onBlur={() => setScheduledTime((prev) => normalizeTime(prev))}
                  placeholder="--:-- --"
                  placeholderTextColor={web.placeholder}
                  keyboardType="number-pad"
                  maxLength={5}
                  accessibilityLabel="Start time"
                  style={styles.timeInput}
                />
                <Feather name="clock" size={rf(14)} color={web.textSoft} />
              </View>
            </View>
          </Field>

          <Field
            label="Expected Duration (min)"
            hint="Used for the refund threshold default in the studio."
          >
            <BoxInput value={duration} onChangeText={setDuration} placeholder="30" numeric />
          </Field>

          <Field label="Available Seats" hint="Max people who can be in the room at once.">
            <BoxInput value={seats} onChangeText={setSeats} placeholder="e.g. 20" numeric />
          </Field>

          <Field label="Coin Price" hint="One-time price per seat, not per minute.">
            <BoxInput value={coinPrice} onChangeText={setCoinPrice} placeholder="e.g. 10" numeric />
          </Field>

          <Field
            label="Highlighted message price"
            hint="What a participant pays to pin their message."
          >
            <BoxInput
              value={highlightedPrice}
              onChangeText={setHighlightedPrice}
              placeholder="e.g. 100 coins to pin a message"
              numeric
            />
          </Field>

          <Field
            label="Refund threshold"
            hint="Minutes connected before an early end no longer refunds entry."
          >
            <BoxInput
              value={refundThreshold}
              onChangeText={setRefundThreshold}
              placeholder="e.g. 2 minutes before refunds stop"
              numeric
            />
          </Field>

          <Field label="Session Description" optional>
            <BoxInput
              value={description}
              onChangeText={setDescription}
              placeholder="What's this session about?"
              multiline
            />
          </Field>

          <Field
            label="Call Mode"
            help="Choose whether fans can see your camera or only hear you."
            hint="Audio-only uses less bandwidth — good for talk-focused sessions."
          >
            <View style={styles.modeToggle}>
              <ModeButton
                icon="video"
                label="Video call"
                active={mode === 'video'}
                onPress={() => setMode('video')}
              />
              <ModeButton
                icon="radio"
                label="Audio only"
                active={mode === 'audio'}
                onPress={() => setMode('audio')}
              />
            </View>
          </Field>

          {/* .gsched-approval-row */}
          <View style={styles.approvalRow}>
            <View style={styles.approvalCopy}>
              <View style={styles.approvalTitleRow}>
                <Text style={styles.approvalTitle}>
                  Require my approval before someone can join
                </Text>
                <HelpIcon hint="Approve each fan before they enter the room." size={13} />
              </View>
              <Text style={styles.approvalNote}>
                Off = fans join instantly up to your seat limit. On = they wait in a queue you
                approve one by one.
              </Text>
            </View>
            <GschedSwitch
              value={requiresApproval}
              onValueChange={setRequiresApproval}
              accessibilityLabel="Require my approval before someone can join"
            />
          </View>

          {/* .gsched-submit */}
          <Pressable
            onPress={schedule}
            disabled={creating || !canSchedule}
            accessibilityRole="button"
            accessibilityState={{ disabled: creating || !canSchedule, busy: creating }}
            accessibilityHint={
              missing.length > 0 ? `Still needed: ${missing.join(', ')}` : undefined
            }
            style={[styles.submit, creating || !canSchedule ? styles.submitDisabled : null]}
          >
            <LinearGradient
              colors={HOT_STOPS}
              start={DIAG_START}
              end={DIAG_END}
              style={styles.submitFill}
            >
              <Feather name="video" size={rf(20)} color={web.white} />
              <Text style={styles.submitLabel}>
                {creating ? 'Scheduling...' : 'Schedule Session'}
              </Text>
            </LinearGradient>
          </Pressable>

          {missing.length > 0 ? (
            <View style={styles.blockedNote}>
              <Feather name="alert-circle" size={rf(13)} color={web.gold} />
              <Text style={styles.blockedNoteText}>
                Add your {missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`} to start the session.
              </Text>
            </View>
          ) : (
            <Text style={styles.submitNote}>
              You&apos;ll land in the group call studio next, where you actually start and manage
              the room.
            </Text>
          )}
        </View>
      </View>

      {/* .gsched-side-card — Session Checklist */}
      <View style={styles.sideCard}>
        <LinearGradient
          colors={SIDE_SHEEN}
          start={DIAG_START}
          end={SHEEN_END}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.h3}>Session Checklist</Text>
        <Text style={styles.sideSub}>Fills in automatically as you complete the form.</Text>
        <View style={styles.checklist}>
          {checklist.map((item) => (
            <View key={item.label} style={styles.checkRow}>
              <Feather
                name={item.done ? 'check-circle' : 'circle'}
                size={rf(18)}
                color={item.done ? web.green : web.checkIdleIcon}
              />
              <Text style={item.done ? styles.checkTextDone : styles.checkText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* .gsched-side-card — If every seat fills */}
      <View style={[styles.sideCard, styles.mathCard]}>
        <LinearGradient
          colors={SIDE_SHEEN}
          start={DIAG_START}
          end={SHEEN_END}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.h3}>If every seat fills</Text>
        <View style={styles.mathRow}>
          <Text style={styles.mathLabel}>Seats × price</Text>
          <Text style={styles.mathValue}>{potential} tk</Text>
        </View>
        <View style={[styles.mathRow, styles.mathRowDivided]}>
          <Text style={styles.mathLabel}>Price per seat (one-time)</Text>
          <Text style={styles.mathValue}>{priceNum.toLocaleString('en-US')} tk</Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  /* .creator-main @media (max-width: 768px) { padding: 12px } + .gsched-page gap */
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 20,
  },

  /* .gsched-header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: web.backBorder,
    backgroundColor: web.backBg,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: web.eyebrow,
  },
  h1: {
    ...typography.h1,
    marginTop: 4,
    color: web.textStrong,
  },

  /* .gsched-card */
  card: {
    borderWidth: 1,
    borderColor: web.cardBorder,
    borderRadius: 14,
    backgroundColor: web.cardBase,
    overflow: 'hidden',
    shadowColor: web.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.38,
    shadowRadius: 29,
    elevation: 10,
  },
  cardHead: {
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 4,
  },
  h2: {
    ...typography.h2,
    color: web.textStrong,
  },
  cardHeadText: {
    ...typography.bodySm,
    marginTop: 6,
    color: web.textSoft,
  },

  /* .gsched-form */
  form: {
    paddingTop: 16,
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 14,
  },

  /* .gsched-field */
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

  /* .gsched-field input / textarea */
  // The field box. Shared with the two read-only <View> fields below, so it
  // carries no text style of its own — see `inputText`.
  input: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: web.textStrong,
    borderWidth: 1,
    borderColor: web.inputBorder,
    borderRadius: 10,
    backgroundColor: web.inputBg,
  },
  inputText: {
    ...typography.input,
  },
  inputMultiline: {
    minHeight: 60,
  },
  inputDisabled: {
    flex: 1,
    justifyContent: 'center',
    opacity: 0.7,
  },
  disabledValue: {
    ...typography.input,
    color: web.textSoft,
  },

  /* .gsched-datetime-split */
  split: {
    flexDirection: 'row',
    gap: 8,
  },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 0,
  },
  timeInput: {
    ...typography.input,
    flex: 1,
    paddingVertical: 8,
    color: web.textStrong,
  },

  /* .gsched-hint */
  hint: {
    ...typography.bodySm,
    color: web.hint,
  },

  /* .gcall-mode-toggle / .gcall-mode-btn */
  modeToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeBtnIdle: {
    borderColor: web.modeIdleBorder,
    backgroundColor: web.modeIdleBg,
  },
  modeBtnActive: {
    borderColor: web.transparent,
    backgroundColor: web.transparent,
    shadowColor: web.pinkGlow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 13,
    elevation: 6,
  },
  modeText: {
    ...typography.body,
    color: web.textSoft,
  },
  modeTextActive: {
    ...typography.body,
    color: web.white,
  },

  /* .gsched-approval-row */
  approvalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: web.approvalBorder,
    borderRadius: 10,
    backgroundColor: web.approvalBg,
  },
  approvalCopy: {
    flex: 1,
    gap: 4,
  },
  approvalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  approvalTitle: {
    ...typography.bodyLg,
    flex: 1,
    color: web.textStrong,
  },
  approvalNote: {
    ...typography.bodySm,
    color: web.hint,
  },

  /* .gsched-switch */
  switch: {
    width: 40,
    height: 22,
    borderRadius: 999,
    justifyContent: 'center',
  },
  switchTrackFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  switchTrackOff: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: web.switchTrack,
  },
  switchKnob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: web.white,
  },
  switchKnobOn: {
    transform: [{ translateX: 18 }],
  },

  /* .gsched-submit */
  submit: {
    minHeight: 52,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: web.pinkGlow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 21,
    elevation: 10,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  submitLabel: {
    ...typography.button,
    color: web.white,
  },
  checking: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  blockedNoteText: {
    ...typography.bodySm,
    flexShrink: 1,
    color: web.gold,
  },
  submitNote: {
    ...typography.bodySm,
    textAlign: 'center',
    color: web.hint,
  },

  /* .gsched-side-card */
  sideCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: web.cardBorder,
    borderRadius: 14,
    backgroundColor: web.sideBase,
    overflow: 'hidden',
    shadowColor: web.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 21,
    elevation: 8,
  },
  /* .gsched-sidebar gap is 16, the page grid gap is 20. */
  mathCard: {
    marginTop: -4,
  },
  h3: {
    ...typography.h3,
    color: web.textStrong,
  },
  sideSub: {
    ...typography.bodySm,
    marginTop: 4,
    marginBottom: 14,
    color: web.hint,
  },

  /* .gsched-checklist */
  checklist: {
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    ...typography.body,
    flex: 1,
    color: web.checkIdleText,
  },
  checkTextDone: {
    ...typography.body,
    flex: 1,
    color: web.textStrong,
  },

  /* .gsched-math-row */
  mathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  mathRowDivided: {
    borderTopWidth: 1,
    borderTopColor: web.mathBorder,
  },
  mathLabel: {
    ...typography.bodySm,
    flex: 1,
    color: web.textSoft,
  },
  mathValue: {
    ...typography.h3,
    color: web.gold,
  },
});

export default ScheduleSessionScreen;
