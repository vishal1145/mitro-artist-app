import { useState } from 'react';

import { groupCallApi } from '@services/api/groupCallApi';
import type { GroupCallParticipant } from '@app-types/groupCall';

/* Straight from the artist web's GroupCallManagementScreen — the API sends
   "requested" for a join request, never "pending_approval". */
export const PENDING = new Set(['requested']);
export const CONNECTED = new Set(['authorized', 'joining', 'connected', 'reconnecting']);

export interface UseParticipantsResult {
  participants: GroupCallParticipant[];
  setParticipants: React.Dispatch<React.SetStateAction<GroupCallParticipant[]>>;
  pending: GroupCallParticipant[];
  connected: GroupCallParticipant[];
  busyUserId: string | null;
  approve: (userId: string) => Promise<void>;
  reject: (userId: string) => Promise<void>;
  remove: (userId: string) => Promise<void>;
  toggleMute: (p: GroupCallParticipant) => Promise<void>;
}

/**
 * Participant list + moderation actions for the group-call room, decoupled
 * from the mount effect (Agora / SignalR) so this stays testable on its own.
 *
 * `getCallId` reads the current group call id from the owning session hook
 * (a ref, since the id isn't known until the room is created/rejoined).
 * `onApproved` lets the session hook re-pull the full list after an approve —
 * the original only did this for approve, not reject/remove, so that
 * asymmetry is preserved here.
 */
export const useParticipants = (
  getCallId: () => string | null,
  onApproved?: () => void,
): UseParticipantsResult => {
  const [participants, setParticipants] = useState<GroupCallParticipant[]>([]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const pending = participants.filter((p) => PENDING.has(p.status) && !p.isRemoved);
  const connected = participants.filter((p) => CONNECTED.has(p.status) && !p.isRemoved);

  const approve = async (userId: string) => {
    const id = getCallId();
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, status: 'authorized' } : p)));
    await groupCallApi.approveParticipant(id, userId);
    setBusyUserId(null);
    onApproved?.();
  };
  const reject = async (userId: string) => {
    const id = getCallId();
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    await groupCallApi.rejectParticipant(id, userId, 'Not this time');
    setBusyUserId(null);
  };
  const remove = async (userId: string) => {
    const id = getCallId();
    if (!id) return;
    setBusyUserId(userId);
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    await groupCallApi.removeParticipant(id, userId, 'Removed by artist');
    setBusyUserId(null);
  };
  const toggleMute = async (p: GroupCallParticipant) => {
    const id = getCallId();
    if (!id) return;
    setParticipants((prev) => prev.map((x) => (x.userId === p.userId ? { ...x, isMuted: !p.isMuted } : x)));
    if (p.isMuted) await groupCallApi.unmuteParticipant(id, p.userId);
    else await groupCallApi.muteParticipant(id, p.userId, 'Muted by artist');
  };

  return { participants, setParticipants, pending, connected, busyUserId, approve, reject, remove, toggleMute };
};
