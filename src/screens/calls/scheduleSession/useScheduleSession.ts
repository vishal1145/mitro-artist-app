import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { groupCallApi } from '@services/api/groupCallApi';
import { activeGroupCallStore } from '@services/groupCall/activeGroupCall';
import { showToast } from '@utils/toast';

import { pad2, normalizeTime } from './format';
import type { UseScheduleSessionResult } from './types';

/** All schedule-session logic. The screen component renders state; it holds none. */
export const useScheduleSession = (): UseScheduleSessionResult => {
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

  return {
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
  };
};
