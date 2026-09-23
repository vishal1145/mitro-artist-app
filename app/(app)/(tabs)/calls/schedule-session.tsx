import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { HelpIcon } from '@components/history';
import { PageHeader, Screen } from '@components/shared';
import { Text } from '@components/ui';
import { BoxInput } from '@screens/calls/scheduleSession/components/BoxInput';
import { Field } from '@screens/calls/scheduleSession/components/Field';
import { GschedSwitch } from '@screens/calls/scheduleSession/components/GschedSwitch';
import { ModeButton } from '@screens/calls/scheduleSession/components/ModeButton';
import { maskTime, normalizeTime } from '@screens/calls/scheduleSession/format';
import { useScheduleSession } from '@screens/calls/scheduleSession/useScheduleSession';
import {
  CARD_SHEEN,
  DIAG_END,
  DIAG_START,
  HOT_STOPS,
  SHEEN_END,
  SIDE_SHEEN,
  web,
} from '@screens/calls/scheduleSession/webTokens';
import { layout, typography } from '@theme';
import { rf } from '@utils/responsive';

/* -------------------------------------------------------------------------- */
/*  Screen                                                                     */
/* -------------------------------------------------------------------------- */

const ScheduleSessionScreen = () => {
  const router = useRouter();

  const {
    checkingActive,
    title,
    setTitle,
    description,
    setDescription,
    scheduledTime,
    setScheduledTime,
    duration,
    setDuration,
    seats,
    setSeats,
    coinPrice,
    setCoinPrice,
    highlightedPrice,
    setHighlightedPrice,
    refundThreshold,
    setRefundThreshold,
    mode,
    setMode,
    requiresApproval,
    setRequiresApproval,
    creating,
    todayLabel,
    potential,
    missing,
    canSchedule,
    checklist,
    schedule,
  } = useScheduleSession();

  const priceNum = parseInt(coinPrice, 10) || 0;

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
          <Text style={styles.mathValue}>{potential} coins</Text>
        </View>
        <View style={[styles.mathRow, styles.mathRowDivided]}>
          <Text style={styles.mathLabel}>Price per seat (one-time)</Text>
          <Text style={styles.mathValue}>{priceNum.toLocaleString('en-US')} coins</Text>
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

  /* .gsched-field input / textarea — shared with `BoxInput`, so this stays a
     plain box style (no text style of its own; see `disabledValue` below for
     the read-only field and `BoxInput` for the editable one). */
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

  /* .gcall-mode-toggle */
  modeToggle: {
    flexDirection: 'row',
    gap: 10,
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
