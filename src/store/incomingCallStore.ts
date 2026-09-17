import { create } from 'zustand';

import { privateCallApi } from '@services/api/privateCallApi';
import type { PrivateCallRequestItem } from '@app-types/privateCall';

/**
 * Global incoming private-call requests.
 *
 * The web pops an "incoming call" dialog over whichever page the artist is on
 * (mounted once at the shell level). We mirror that: this store polls the
 * pending-requests endpoint app-wide while signed in, and the `IncomingCallOverlay`
 * (rendered in the root layout) shows the earliest-expiring one over any screen.
 *
 * Lifecycle is auth-driven — `start()` on login/cold-start, `stop()` on logout —
 * exactly like the notification store. A fresh `private_call_request` push also
 * calls `refresh()` for an instant pop instead of waiting for the next poll.
 */

/** How often to check for new / expired requests while signed in. */
const POLL_MS = 6000;

interface IncomingCallState {
  /** The request currently shown in the overlay, or null. */
  current: PrivateCallRequestItem | null;
  /** Begin app-wide polling. Idempotent. */
  start: () => void;
  /** Stop polling and clear everything (logout). */
  stop: () => void;
  /** Fetch pending requests now and reconcile what's shown. */
  refresh: () => Promise<void>;
  /** Mark a request handled (accepted/rejected) so polling won't re-show it. */
  dismiss: (requestId: string) => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
/** Requests the artist already actioned this session — never re-pop these. */
const resolved = new Set<string>();

const isLive = (r: PrivateCallRequestItem): boolean =>
  new Date(r.expiresAtUtc).getTime() > Date.now();

/** Earliest-expiring still-pending request that hasn't been actioned. */
const pickNext = (items: PrivateCallRequestItem[]): PrivateCallRequestItem | null => {
  const live = items
    .filter((r) => !resolved.has(r.requestId) && isLive(r))
    .sort(
      (a, b) => new Date(a.expiresAtUtc).getTime() - new Date(b.expiresAtUtc).getTime(),
    );
  return live[0] ?? null;
};

export const useIncomingCallStore = create<IncomingCallState>((set, get) => ({
  current: null,

  start: () => {
    if (pollTimer) return;
    void get().refresh();
    pollTimer = setInterval(() => void get().refresh(), POLL_MS);
  },

  stop: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    resolved.clear();
    set({ current: null });
  },

  refresh: async () => {
    const res = await privateCallApi.getRequests();
    if (!res.success) return;

    // If the one on screen is still pending, keep it (refresh its countdown data)
    // rather than swapping it out from under the artist mid-decision.
    const currentId = get().current?.requestId;
    if (currentId && !resolved.has(currentId)) {
      const still = res.data.find((r) => r.requestId === currentId);
      if (still && isLive(still)) {
        set({ current: still });
        return;
      }
    }

    set({ current: pickNext(res.data) });
  },

  dismiss: (requestId) => {
    resolved.add(requestId);
    if (get().current?.requestId === requestId) {
      set({ current: null });
    }
  },
}));
