import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader, Screen } from '@components/shared';
import { GradientButton, LucideIcon, Text, type LucideIconName } from '@components/ui';
import { groupCallApi } from '@services/api/groupCallApi';
import { activeGroupCallStore } from '@services/groupCall/activeGroupCall';
import { colors, fontFamily, gradientDirection, gradients, layout, radius, size, spacing, typography } from '@theme';
import { showToast } from '@utils/toast';
import { rf } from '@utils/responsive';

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

/** One option row: pink icon · title + hint · control (web .gs3-row). */
const Row = memo(({ icon, title, hint, first, inline, children }: { icon: LucideIconName; title: string; hint: string; first?: boolean; inline?: boolean; children: React.ReactNode }) => (
  <View style={[styles.row, first ? styles.rowFirst : styles.rowBorder]}>
    <View style={styles.rowTop}>
      <LucideIcon name={icon} size={rf(18)} color={colors.pink} />
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      {inline ? children : null}
    </View>
    {inline ? null : <View style={styles.rowCtl}>{children}</View>}
  </View>
));
Row.displayName = 'Row';

/** Number input with a trailing unit (web .gs3-unit). */
const UnitInput = memo(({ value, onChangeText, placeholder, unit, label }: { value: string; onChangeText: (v: string) => void; placeholder: string; unit: string; label: string }) => (
  <View style={styles.unitWrap}>
    <TextInput
      value={value}
      onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
      placeholder={placeholder}
      placeholderTextColor={colors.textDim}
      keyboardType="number-pad"
      accessibilityLabel={label}
      style={styles.unitInput}
    />
    <Text style={styles.unitText} pointerEvents="none">{unit}</Text>
  </View>
));
UnitInput.displayName = 'UnitInput';

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
  const submitting = useRef(false);
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

  const schedule = async () => {
    // Synchronous lock: `creating` is React state and only flips on the next
    // render, so a fast double-tap could slip through. The ref blocks it
    // immediately, and stays locked until we navigate away (or it fails).
    if (creating || submitting.current) {
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

    submitting.current = true;
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
    if (!res.success) {
      // Only a failure re-enables the button. On success it stays disabled
      // ("Scheduling...") through the follow-up calls until the room opens.
      submitting.current = false;
      setCreating(false);
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
        <ActivityIndicator size="small" color={colors.pink} />
      </Screen>
    );
  }

  const sections = [
    { n: 1, label: 'Basics', done: hasTitle },
    { n: 2, label: 'Time & seats', done: seatsNum > 0 },
    { n: 3, label: 'Price & rules', done: priceNum >= 0 && hasHighlighted && hasRefund },
  ];
  const readyCount = sections.filter((x) => x.done).length;
  const normalizedTime = normalizeTime(scheduledTime);
  const startLabel = normalizedTime
    ? new Date(`${todayIso}T${normalizedTime}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={
        <PageHeader eyebrow="GROUP CALL" eyebrowIcon="video" title="Schedule Group Session" onBack={() => router.back()} />
      }
    >
      {/* .gs3-steps */}
      <View style={styles.steps}>
        {sections.map((x) => (
          <View key={x.n} style={[styles.step, x.done ? styles.stepDone : null]}>
            <View style={[styles.stepNum, x.done ? styles.stepNumDone : null]}>
              {x.done ? (
                <LucideIcon name="check" size={rf(12)} color={colors.success} />
              ) : (
                <Text style={styles.stepNumText}>{x.n}</Text>
              )}
            </View>
            <Text style={[styles.stepText, x.done ? styles.stepTextDone : null]}>{x.label}</Text>
          </View>
        ))}
      </View>

      {/* .gs3-preview (sits first on phones) */}
      <View style={styles.previewCol}>
        <View style={styles.card}>
          <View style={styles.cover}>
            <LinearGradient colors={gradients.sessionCover} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={styles.mode}>
              <LucideIcon name={mode === 'video' ? 'video' : 'radio'} size={rf(13)} color={colors.white} />
              <Text style={styles.modeText}>{mode === 'video' ? 'Video call' : 'Audio only'}</Text>
            </View>
            <Text style={styles.coverTitle}>{title.trim() || 'Your session title'}</Text>
            <Text style={styles.coverSub}>
              {startLabel ? `Today at ${startLabel}` : 'Starts on-demand'}
              {duration ? ` · ${duration} min` : ''}
            </Text>
          </View>
          <View style={styles.cardBody}>
            {description.trim() ? <Text style={styles.cardDesc}>{description.trim()}</Text> : null}
            <View style={styles.chips}>
              <View style={styles.chip}>
                <LucideIcon name="users" size={rf(14)} color={colors.pink} />
                <Text style={styles.chipText}>{seatsNum} seats</Text>
              </View>
              <View style={styles.chip}>
                <LucideIcon name="coins" size={rf(14)} color={colors.pink} />
                <Text style={styles.chipText}>{priceNum.toLocaleString()} coins</Text>
              </View>
              {requiresApproval ? (
                <View style={styles.chip}>
                  <LucideIcon name="shield-check" size={rf(14)} color={colors.pink} />
                  <Text style={styles.chipText}>Approval</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.math}>
            <Text style={styles.mathTitle}>If every seat fills</Text>
            <View style={styles.mathRow}>
              <Text style={styles.mathLabel}>Seats × price</Text>
              <Text style={styles.mathValue}>{potential} coins</Text>
            </View>
            <View style={styles.mathRow}>
              <Text style={styles.mathLabel}>Price per seat (one-time)</Text>
              <Text style={styles.mathValue}>{priceNum.toLocaleString()} coins</Text>
            </View>
          </View>
        </View>
        <Text style={styles.ready}>{`${readyCount} of 3 sections ready`}</Text>
      </View>

      {/* .gs3-form */}
      <View style={styles.block}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Session title" placeholderTextColor={colors.textDim} style={styles.titleInput} accessibilityLabel="Session title" />
        <TextInput value={description} onChangeText={setDescription} placeholder="Add a short description (optional)" placeholderTextColor={colors.textDim} style={styles.descInput} multiline textAlignVertical="top" accessibilityLabel="Session description" />
      </View>

      <View style={styles.block}>
        <View style={styles.h}>
          <View style={styles.hNum}><Text style={styles.hNumText}>2</Text></View>
          <Text style={styles.hText}>Time &amp; seats</Text>
        </View>
        <View>
          <Row first icon="calendar-days" title="Start" hint="Today only. Leave the time blank to start on-demand.">
            <View style={styles.split}>
              <TextInput value={todayLabel} editable={false} style={[styles.ctlInput, styles.ctlDisabled]} accessibilityLabel="Date" />
              <View style={styles.timeWrap}>
                <TextInput value={scheduledTime} onChangeText={(t) => setScheduledTime(maskTime(t))} placeholder="--:--" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={5} style={[styles.ctlInput, styles.timeInput]} accessibilityLabel="Start time" />
                <View style={styles.timeIcon} pointerEvents="none">
                  <LucideIcon name="clock" size={rf(14)} color={colors.textMuted} />
                </View>
              </View>
            </View>
          </Row>
          <Row icon="clock" title="Expected duration" hint="Used for the refund threshold default.">
            <UnitInput value={duration} onChangeText={setDuration} placeholder="30" unit="min" label="Duration" />
          </Row>
          <Row icon="users" title="Available seats" hint="Max people in the room at once.">
            <UnitInput value={seats} onChangeText={setSeats} placeholder="20" unit="seats" label="Available seats" />
          </Row>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.h}>
          <View style={styles.hNum}><Text style={styles.hNumText}>3</Text></View>
          <Text style={styles.hText}>Price &amp; rules</Text>
        </View>
        <View>
          <Row first icon="coins" title="Coin price" hint="One-time price per seat, not per minute.">
            <UnitInput value={coinPrice} onChangeText={setCoinPrice} placeholder="10" unit="coins" label="Coin price" />
          </Row>
          <Row icon="sparkles" title="Highlighted message price" hint="What a participant pays to pin their message.">
            <UnitInput value={highlightedPrice} onChangeText={setHighlightedPrice} placeholder="100" unit="coins" label="Highlighted message price" />
          </Row>
          <Row icon="undo-2" title="Refund threshold" hint="Minutes connected before an early end no longer refunds entry.">
            <UnitInput value={refundThreshold} onChangeText={setRefundThreshold} placeholder="2" unit="min" label="Refund threshold" />
          </Row>
          <Row inline icon="video" title="Call mode" hint="Audio-only uses less bandwidth.">
            <View style={styles.seg} accessibilityRole="radiogroup">
              {(['video', 'audio'] as const).map((m) => {
                const active = mode === m;
                return (
                  <Pressable key={m} onPress={() => setMode(m)} accessibilityRole="radio" accessibilityState={{ selected: active }} style={styles.segBtn}>
                    {active ? <LinearGradient colors={gradients.cta} start={gradientDirection.diagonal.start} end={gradientDirection.diagonal.end} style={StyleSheet.absoluteFill} /> : null}
                    <LucideIcon name={m === 'video' ? 'video' : 'radio'} size={rf(14)} color={active ? colors.white : colors.textMuted} />
                    <Text style={[styles.segText, active ? styles.segTextActive : null]}>{m === 'video' ? 'Video' : 'Audio'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>
          <Row inline icon="shield-check" title="Require my approval to join" hint="Off: fans join instantly. On: they wait in a queue you approve.">
            <Pressable onPress={() => setRequiresApproval((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: requiresApproval }} accessibilityLabel="Require my approval before someone can join" style={styles.switchTrack}>
              {requiresApproval ? <LinearGradient colors={gradients.cta} start={gradientDirection.diagonal.start} end={gradientDirection.diagonal.end} style={StyleSheet.absoluteFill} /> : null}
              <View style={[styles.switchKnob, requiresApproval ? styles.switchKnobOn : null]} />
            </Pressable>
          </Row>
        </View>
      </View>

      <GradientButton
        label={creating ? 'Scheduling...' : 'Schedule Session'}
        leftIcon="video"
        disabled={creating || !canSchedule}
        onPress={schedule}
        accessibilityHint={missing.length > 0 ? `Still needed: ${missing.join(', ')}` : undefined}
      />
      <Text style={styles.note}>You&apos;ll land in the group call studio next, where you actually start and manage the room.</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md, gap: spacing.sm },
  checking: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xxs, paddingLeft: spacing.xxs, paddingRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  stepDone: { borderColor: colors.successBorder },
  stepNum: { width: 20, height: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  stepNumDone: { backgroundColor: colors.successBg },
  stepNumText: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.textMuted },
  stepText: { ...typography.bodySm, fontFamily: fontFamily.medium, color: colors.textMuted },
  stepTextDone: { color: colors.success },

  previewCol: { gap: spacing.sm },
  card: { overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  cover: { minHeight: 168, justifyContent: 'flex-end', gap: spacing.xxs, padding: spacing.md, backgroundColor: colors.background },
  mode: { position: 'absolute', top: spacing.md, left: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, backgroundColor: colors.chipSurface, borderRadius: radius.pill },
  modeText: { ...typography.bodySm, fontFamily: fontFamily.medium, color: colors.white },
  coverTitle: { ...typography.h1, color: colors.white },
  coverSub: { ...typography.subtitle, color: colors.white, opacity: 0.85 },
  cardBody: { gap: spacing.sm, padding: spacing.md },
  cardDesc: { ...typography.subtitle, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  chipText: { ...typography.bodySm, fontFamily: fontFamily.medium, color: colors.textPrimary },
  math: { gap: spacing.xs, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  mathTitle: { ...typography.body, fontFamily: fontFamily.semibold, color: colors.textPrimary },
  mathRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  mathLabel: { ...typography.subtitle, color: colors.textMuted },
  mathValue: { ...typography.subtitle, fontFamily: fontFamily.semibold, color: colors.warning },
  ready: { ...typography.label, textAlign: 'center', color: colors.textMuted },

  block: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  titleInput: { ...typography.h1, padding: 0, color: colors.textPrimary },
  descInput: { ...typography.input, minHeight: size.input, padding: 0, color: colors.textPrimary },
  h: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  hNum: { width: 24, height: 24, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accentBorder },
  hNumText: { ...typography.bodySm, color: colors.pink },
  hText: { ...typography.metric, color: colors.textPrimary },

  row: { gap: spacing.xs, paddingVertical: spacing.sm },
  rowFirst: { paddingTop: 0 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowCopy: { flex: 1, gap: spacing.xxs },
  rowTitle: { ...typography.bodyLg, color: colors.textPrimary },
  rowHint: { ...typography.bodySm, color: colors.textMuted },
  rowCtl: { marginLeft: spacing.lg + spacing.xs },

  split: { flexDirection: 'row', gap: spacing.xs },
  splitCell: { flex: 1 },
  ctlInput: { ...typography.input, height: size.input, minWidth: 0, paddingHorizontal: spacing.sm, color: colors.textPrimary, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input },
  ctlDisabled: { flex: 1, opacity: 0.6 },
  timeWrap: { flex: 1, justifyContent: 'center' },
  timeInput: { paddingRight: spacing.xl },
  timeIcon: { position: 'absolute', right: spacing.sm },
  unitWrap: { alignSelf: 'stretch', justifyContent: 'center' },
  unitInput: { ...typography.input, height: size.input, paddingLeft: spacing.sm, paddingRight: spacing.xl + spacing.sm, textAlign: 'right', color: colors.textPrimary, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input },
  unitText: { ...typography.bodySm, position: 'absolute', right: spacing.sm, color: colors.textDim },
  seg: { flexDirection: 'row', gap: spacing.xxs, padding: spacing.xxs, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radius.xs, overflow: 'hidden' },
  segText: { ...typography.subtitle, fontFamily: fontFamily.medium, color: colors.textMuted },
  segTextActive: { color: colors.white },
  switchTrack: { width: 40, height: 22, borderRadius: radius.pill, backgroundColor: colors.borderStrong, overflow: 'hidden', justifyContent: 'center' },
  switchKnob: { width: 16, height: 16, marginLeft: 3, borderRadius: radius.pill, backgroundColor: colors.white },
  switchKnobOn: { marginLeft: 21 },

  note: { ...typography.bodySm, textAlign: 'center', color: colors.textMuted, paddingBottom: spacing.sm },
});

export default ScheduleSessionScreen;
