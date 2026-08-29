import { create } from 'zustand';

import { NOTIFICATIONS } from '@constants/app';
import { notificationApi } from '@services/api';
import { notificationHub } from '@services/realtime/notificationHub';
import type { NotificationItem } from '@app-types/api';
import { logger } from '@utils/logger';
import { showNotificationToast } from '@utils/notifications';

/**
 * In-app notifications (Zustand) — the bell badge, the notification list, and
 * the toast-on-receipt behavior all read from this one store.
 *
 * Lifecycle is driven by auth, not by any screen: `init()` runs once on login
 * (and again on a cold start with an existing session), `teardown()` runs on
 * logout. See connectAuthInterceptors' sibling wiring in store/authStore.ts.
 */

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  hydrated: boolean;
  refreshing: boolean;

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

  init: async () => {
    const [listResult, countResult] = await Promise.all([
      notificationApi.getNotifications(NOTIFICATIONS.take),
      notificationApi.getUnreadCount(),
    ]);

    if (!listResult.success) {
      logger.warn('Failed to load notifications', { error: listResult.error });
    }
    if (!countResult.success) {
      logger.warn('Failed to load unread count', { error: countResult.error });
    }

    set({
      items: listResult.success ? listResult.data : [],
      unreadCount: countResult.success ? countResult.data.unreadCount : 0,
      hydrated: true,
    });

    notificationHub.setHandler((item) => get().ingest(item));
    await notificationHub.connect();
  },

  teardown: () => {
    notificationHub.setHandler(null);
    void notificationHub.disconnect();
    set({ items: [], unreadCount: 0, hydrated: false, refreshing: false });
  },

  refresh: async () => {
    set({ refreshing: true });
    const [listResult, countResult] = await Promise.all([
      notificationApi.getNotifications(NOTIFICATIONS.take),
      notificationApi.getUnreadCount(),
    ]);
    set({
      items: listResult.success ? listResult.data : get().items,
      unreadCount: countResult.success ? countResult.data.unreadCount : get().unreadCount,
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
    if (result.success) {
      set({ unreadCount: result.data.unreadCount });
    } else {
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
    if (result.success) {
      set({ unreadCount: result.data.unreadCount });
    } else {
      // Roll back — a failed write shouldn't leave the badge silently wrong.
      set({ items: previous });
      logger.warn('markAllRead failed', { error: result.error });
    }
  },

  ingest: (item) => {
    const alreadyKnown = get().items.some((existing) => existing.id === item.id);
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
