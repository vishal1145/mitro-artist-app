import { mmkvStorage } from '@services/storage';
import type { StartBroadcastResponse } from '@app-types/broadcast';

/**
 * Persists the artist's currently-live broadcast client-side (the backend has
 * no "get active broadcast" endpoint — the web keeps it in sessionStorage the
 * same way). Lets the artist leave the live room (back button) and come back
 * to REJOIN the same broadcast instead of hitting "already broadcasting live"
 * when they try to start a new one.
 */
const KEY = 'mitro.artist.activeBroadcast';

export interface ActiveBroadcastRecord {
  broadcastId: string;
  title: string;
  agoraChannelName: string;
  agoraUid: number;
  agoraToken: string;
}

export const activeBroadcastStore = {
  save(title: string, r: StartBroadcastResponse): Promise<void> {
    return mmkvStorage.setJSON(KEY, {
      broadcastId: r.broadcastId,
      title,
      agoraChannelName: r.agoraChannelName,
      agoraUid: r.agoraUid,
      agoraToken: r.agoraToken,
    } satisfies ActiveBroadcastRecord);
  },
  get(): Promise<ActiveBroadcastRecord | null> {
    return mmkvStorage.getJSON<ActiveBroadcastRecord>(KEY);
  },
  clear(): Promise<void> {
    return mmkvStorage.remove(KEY);
  },
};
