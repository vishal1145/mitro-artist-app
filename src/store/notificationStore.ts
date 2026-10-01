import { create } from 'zustand';

import { NOTIFICATIONS } from '@constants/app';
import { notificationApi } from '@services/api';
import { notificationHub } from '@services/realtime/notificationHub';
import type { NotificationItem } from '@app-types/api';
import { logger } from '@utils/logger';
import { showNotificationToast } from '@utils/notifications';

import { useIncomingCallStore } from './incomingCallStore';

/**
 * In-app notifications (Zustand) — the bell badge, the notification list, and
 * the toast-on-receipt behavior all read from this one store.
 *
 * Lifecycle is driven by auth, not by any screen: `init()` runs once on login
 * (and again on a cold start with an existing session), `teardown()` runs on
 * logout. See connectAuthInterceptors' sibling wiring in store/authStore.ts.
 */

/**
 * Excluded notification types that must NEVER appear in the notification bell,
 * dropdown, or full notifications list (e.g. chat messages have their own tab badge).
 * Matches Mitro.Artist.UI/src/context/NotificationContext.tsx (Issue 3).
 */
export const EXCLUDED_NOTIFICATION_TYPES = ['private_message'] as const;

export const isExcludedNotification = (
  n: { type?: string | null; referenceType?: string | null } | null | undefined,
): boolean => {
  if (!n) return false;
  return (
    (!!n.type && EXCLUDED_NOTIFICATION_TYPES.includes(n.type as any)) ||
    (!!n.referenceType && EXCLUDED_NOTIFICATION_TYPES.includes(n.referenceType as any))
  );
};

/** Collapse duplicates by id AND by content signature — the same event delivered
 * twice (realtime hub + FCM) can arrive under two different ids. */
const sigOf = (n: NotificationItem) =>
  `${n.type}|${n.referenceType ?? ''}|${n.referenceId ?? ''}|${n.title}|${n.body}`;

const dedupeNotifications = (items: NotificationItem[]): NotificationItem[] => {
  const seenId = new Set<string>();
  const seenSig = new Set<string>();
  const out: NotificationItem[] = [];
  for (const it of items) {
    if (isExcludedNotification(it)) continue;
    const sig = sigOf(it);
    if (seenId.has(it.id) || seenSig.has(sig)) continue;
    seenId.add(it.id);
    seenSig.add(sig);
    out.push(it);
  }
  return out;
};

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  hydrated: boolean;
  refreshing: boolean;
  /**
   * How many rows the last request asked the server for.
   *
   * `GET /api/artist/notifications` takes `take` only — there is no `skip` —
   * so paging means asking for a bigger window each time rather than fetching
   * a disjoint page. The realtime hub prepends to the same list, and
   * `dedupeNotifications` keeps the two from doubling up.
   */
  take: number;
  /** False once the server returns fewer rows than we asked for. */
  hasMore: boolean;
  loadingMore: boolean;
  /** Widen the window by one page. No-op while one is already in flight. */
  loadMore: () => Promise<void>;

  /** Fetch the initial list + count, then open the realtime hub. */
  init: () => Promise<void>;
  /** Close the hub and drop everything — the next artist shouldn't see it. */
  teardown: () => void;
  /** Pull-to-refresh on the notifications screen. */
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /**
   * Prepend a freshly-arrived notification (hub push or foreground FCM
   * message), bump the badge, and toast it. De-duplicates by id, since the
   * same event can arrive over both channels.
   */
  ingest: (item: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  hydrated: false,
  refreshing: false,
  take: NOTIFICATIONS.take,
  hasMore: true,
  loadingMore: false,

  loadMore: async () => {
    const { loadingMore, hasMore, take } = get();
    if (loadingMore || !hasMore) {
      return;
    }
    const nextTake = take + NOTIFICATIONS.take;
    set({ loadingMore: true });
    const result = await notificationApi.getNotifications(nextTake);
    if (!result.success) {
      logger.warn('Failed to load more notifications', { error: result.error });
      set({ loadingMore: false });
      return;
    }
    set({
      items: dedupeNotifications(result.data),
      take: nextTake,
      // A short page means the server has nothing older left.
      hasMore: result.data.length >= nextTake,
      loadingMore: false,
    });
  },

  init: async () => {
    const [listResult] = await Promise.all([
      notificationApi.getNotifications(NOTIFICATIONS.take),
      notificationApi.getUnreadCount(),
    ]);

    if (!listResult.success) {
      logger.warn('Failed to load notifications', { error: listResult.error });
    }

    const filteredItems = listResult.success ? dedupeNotifications(listResult.data) : [];
    set({
      items: filteredItems,
      unreadCount: filteredItems.filter((i) => !i.isRead).length,
      hydrated: true,
      take: NOTIFICATIONS.take,
      hasMore: listResult.success ? listResult.data.length >= NOTIFICATIONS.take : false,
    });

    notificationHub.setHandler((item) => get().ingest(item));
    notificationHub.setOnReconnected(() => void get().refresh());
    await notificationHub.connect();
  },

  teardown: () => {
    notificationHub.setHandler(null);
    notificationHub.setOnReconnected(null);
    void notificationHub.disconnect();
    set({
      items: [],
      unreadCount: 0,
      hydrated: false,
      refreshing: false,
      take: NOTIFICATIONS.take,
      hasMore: true,
      loadingMore: false,
    });
  },

  refresh: async () => {
    // Refresh re-asks for the window the artist has already scrolled open, so
    // pulling down doesn't collapse the list back to the first page.
    const windowSize = get().take;
    set({ refreshing: true });
    const [listResult] = await Promise.all([
      notificationApi.getNotifications(windowSize),
      notificationApi.getUnreadCount(),
    ]);
    const filteredItems = listResult.success ? dedupeNotifications(listResult.data) : get().items;
    set({
      items: filteredItems,
      unreadCount: filteredItems.filter((i) => !i.isRead).length,
      hasMore: listResult.success ? listResult.data.length >= windowSize : get().hasMore,
      refreshing: false,
    });
  },

  markRead: async (id) => {
    const target = get().items.find((item) => item.id === id);
    if (!target || target.isRead) {
      return;
    }

    // Optimistic — the row reads as tapped immediately.
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    const result = await notificationApi.markRead(id);
    if (!result.success) {
      logger.warn('markRead failed', { id, error: result.error });
    }
  },

  markAllRead: async () => {
    const previous = get().items;

    set((state) => ({
      items: state.items.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));

    const result = await notificationApi.markAllRead();
    if (!result.success) {
      // Roll back — a failed write shouldn't leave the badge silently wrong.
      set({ items: previous });
      logger.warn('markAllRead failed', { error: result.error });
    }
  },

  ingest: (item) => {
    // An incoming private-call request should pop the global overlay right away
    // rather than waiting for the next poll — mirror the web's hub-driven pop.
    if (item.type === 'private_call_request') {
      void useIncomingCallStore.getState().refresh();
    }

    // Excluded notifications (e.g. chat messages) must NEVER appear in the
    // notification bell list, dropdown, or unread badge (Issue 3).
    if (isExcludedNotification(item)) {
      return;
    }

    const sig = sigOf(item);
    const alreadyKnown = get().items.some(
      (existing) => existing.id === item.id || sigOf(existing) === sig,
    );
    if (alreadyKnown) {
      return;
    }

    set((state) => ({
      items: [item, ...state.items],
      unreadCount: item.isRead ? state.unreadCount : state.unreadCount + 1,
    }));

    if (!item.isRead) {
      showNotificationToast(item);
    }
  },
}));
