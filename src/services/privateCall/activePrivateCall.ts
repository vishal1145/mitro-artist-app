import { mmkvStorage } from '@services/storage';
import type { PrivateCallConnectionResponse } from '@app-types/privateCall';

/**
 * Persists the artist's currently-running 1:1 call, mirroring the artist web's
 * sessionStorage `activePrivateCall` record (and the app's own
 * `activeBroadcastStore` / `activeGroupCallStore`).
 *
 * The room is entered with a connection handed over from accepting a request,
 * and that connection only exists in navigation params. Without this record an
 * artist who backs out of a live call is stranded: the call keeps running and
 * being billed server-side, but there is no way back into it.
 *
 * Written in two shapes, like the web:
 *   - `savePointer` from `getActive()`, which knows the id but no Agora details.
 *   - `save` after accept / connect, which has the full channel handshake.
 * Cleared only when the call actually ends.
 */
const KEY = 'mitro.artist.activePrivateCall';

export interface ActivePrivateCallRecord {
  privateCallId: string;
  userId?: string;
  /** Shown in the room header while reconnecting. */
  fanName: string;
  ratePerMin: number;
  /** Epoch ms the artist first connected — lets the timer resume correctly. */
  startedAt: number;
  agoraChannelName?: string;
  agoraUid?: number;
  agoraToken?: string;
}

export interface PrivateCallMeta {
  userId?: string;
  fanName: string;
  ratePerMin: number;
}

export const activePrivateCallStore = {
  /** Full record — after accepting a request or reconnecting to one. */
  async save(r: PrivateCallConnectionResponse, meta: PrivateCallMeta): Promise<void> {
    const existing = await mmkvStorage.getJSON<ActivePrivateCallRecord>(KEY);
    const record: ActivePrivateCallRecord = {
      privateCallId: r.privateCallId,
      userId: meta.userId ?? existing?.userId,
      fanName: meta.fanName,
      ratePerMin: meta.ratePerMin,
      // Keep the original start time across reconnects so the meter is honest.
      startedAt:
        existing && existing.privateCallId === r.privateCallId
          ? existing.startedAt
          : Date.now(),
      agoraChannelName: r.agoraChannelName,
      agoraUid: r.agoraUid,
      agoraToken: r.agoraToken,
    };
    return mmkvStorage.setJSON(KEY, record);
  },

  /**
   * Id-only record, from `getActive()`. Enough to rejoin — the room asks for a
   * fresh connection anyway.
   */
  async savePointer(
    privateCallId: string,
    meta: Partial<PrivateCallMeta> = {},
  ): Promise<void> {
    const existing = await mmkvStorage.getJSON<ActivePrivateCallRecord>(KEY);
    if (existing?.privateCallId === privateCallId) return; // already know this one
    const record: ActivePrivateCallRecord = {
      privateCallId,
      userId: meta.userId,
      fanName: meta.fanName ?? 'Fan',
      ratePerMin: meta.ratePerMin ?? 0,
      startedAt: Date.now(),
    };
    return mmkvStorage.setJSON(KEY, record);
  },

  get(): Promise<ActivePrivateCallRecord | null> {
    return mmkvStorage.getJSON<ActivePrivateCallRecord>(KEY);
  },

  clear(): Promise<void> {
    return mmkvStorage.remove(KEY);
  },
};
