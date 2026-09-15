import { mmkvStorage } from '@services/storage';
import type { GroupCallConnectionResponse } from '@app-types/groupCall';

/**
 * Persists the artist's currently-running group call client-side — the same
 * trick `activeBroadcastStore` uses (and the artist web's sessionStorage
 * `mitro_active_group_call` record).
 *
 * The backend has no "get my active group call" endpoint, so without this the
 * artist who backs out of a live room is stuck: the call keeps running server
 * side, they can't get back into it, and they can't create a new one either
 * (the backend only allows one at a time, and a new one is only possible once
 * the old one is ended). Keeping the id here lets them walk out and walk back
 * in — REJOIN the same room instead of hitting "already in a group call".
 *
 * Written in two steps, like the web:
 *   - `saveDraft` right after Create, when there's no Agora connection yet.
 *   - `saveConnection` after Start/Rejoin, merging the channel details on.
 * Cleared only when the call is actually ended or cancelled.
 */
const KEY = 'mitro.artist.activeGroupCall';

export interface ActiveGroupCallRecord {
  groupCallId: string;
  title: string;
  maxParticipants: number;
  entryPrice: number;
  requiresApproval: boolean;
  audioOrVideoMode: 'audio' | 'video';
  /** Epoch ms the room actually went live — lets the timer resume on rejoin. */
  startedAt?: number;
  agoraChannelName?: string;
  agoraUid?: number;
  agoraToken?: string;
}

export interface GroupCallDraft {
  groupCallId: string;
  title: string;
  maxParticipants: number;
  entryPrice: number;
  requiresApproval: boolean;
  audioOrVideoMode: 'audio' | 'video';
}

export const activeGroupCallStore = {
  /** Straight after Create — no channel details exist yet. */
  saveDraft(draft: GroupCallDraft): Promise<void> {
    return mmkvStorage.setJSON(KEY, { ...draft } satisfies ActiveGroupCallRecord);
  },

  /** After Start / Rejoin — merges the Agora details onto the existing record. */
  async saveConnection(r: GroupCallConnectionResponse, fallback: GroupCallDraft): Promise<void> {
    const existing = await mmkvStorage.getJSON<ActiveGroupCallRecord>(KEY);
    const record: ActiveGroupCallRecord = {
      ...(existing ?? fallback),
      groupCallId: r.groupCallId,
      startedAt: existing?.startedAt ?? Date.now(),
      agoraChannelName: r.agoraChannelName,
      agoraUid: r.agoraUid,
      agoraToken: r.agoraToken,
    };
    return mmkvStorage.setJSON(KEY, record);
  },

  get(): Promise<ActiveGroupCallRecord | null> {
    return mmkvStorage.getJSON<ActiveGroupCallRecord>(KEY);
  },

  clear(): Promise<void> {
    return mmkvStorage.remove(KEY);
  },
};
