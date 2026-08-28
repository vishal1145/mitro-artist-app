import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  type Messaging,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { notificationApi } from '@services/api';
import { useNotificationStore } from '@store/notificationStore';
import type { DevicePlatform, NotificationItem } from '@app-types/api';
import { logger } from '@utils/logger';
import { navigateToNotification } from '@utils/notifications';

/**
 * FCM push: permission, token registration, and the foreground / background-
 * tap / quit-tap listeners.
 *
 * `register`/`unregister` are called from the auth store (login/logout).
 * `setupListeners` is called once from the root layout, independent of auth —
 * a quit-state tap has to deep-link even before the auth store hydrates.
 *
 * @react-native-firebase/messaging v26 dropped the namespaced `messaging()`
 * API for the modular one used throughout this file.
 */

let currentToken: string | null = null;
let listenersAttached = false;

const platformName = (): DevicePlatform => (Platform.OS === 'ios' ? 'ios' : 'android');

/** No push on web — this app's web target has no FCM. */
const messagingInstance = (): Messaging | null => {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    return getMessaging();
  } catch (error) {
    logger.warn('Firebase messaging unavailable', { error: String(error) });
    return null;
  }
};

/**
 * A push message carries the same fields as the REST/hub `NotificationItem`
 * in its `data` payload (FCM data values are always strings). Falls back to
 * the OS-rendered `notification` block for title/body, and to the message id
 * when the server didn't send one — either is enough to show and route it.
 */
const parseNotificationData = (message: RemoteMessage): NotificationItem | null => {
  const data = (message.data ?? {}) as Record<string, string | undefined>;
  const id = data.id ?? message.messageId;
  if (!id) {
    return null;
  }

  return {
    id,
    type: data.type ?? 'system',
    title: data.title ?? message.notification?.title ?? '',
    body: data.body ?? message.notification?.body ?? '',
    referenceType: data.referenceType ?? null,
    referenceId: data.referenceId ?? null,
    actionUrl: data.actionUrl ?? null,
    isRead: false,
    createdAtUtc: data.createdAtUtc ?? new Date().toISOString(),
  };
};

export const pushNotifications = {
  /** Request permission, fetch the FCM token, and register it. Call on login. */
  async register(): Promise<void> {
    const messaging = messagingInstance();
    if (!messaging) {
      return;
    }

    try {
      // requestPermission is deprecated upstream in favor of expo-notifications
      // or react-native-permissions, but still functional — kept rather than
      // adding a package this app doesn't otherwise need.
      const status = await requestPermission(messaging);
      const granted =
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL;
      if (!granted) {
        logger.info('Push permission not granted', { status });
        return;
      }

      const token = await getToken(messaging);
      currentToken = token;

      const result = await notificationApi.registerDevice({
        fcmToken: token,
        platform: platformName(),
      });
      if (!result.success) {
        logger.warn('Device registration failed', { error: result.error });
      }
    } catch (error) {
      logger.warn('Push registration failed', { error: String(error) });
    }
  },

  /** Unregister the current token. Best-effort — call on logout. */
  async unregister(): Promise<void> {
    if (!currentToken) {
      return;
    }
    const token = currentToken;
    currentToken = null;

    try {
      const result = await notificationApi.unregisterDevice({ fcmToken: token });
      if (!result.success) {
        logger.warn('Device unregistration failed', { error: result.error });
      }
    } catch (error) {
      logger.warn('Device unregistration failed', { error: String(error) });
    }
  },

  /**
   * Wire the foreground / background-tap / quit-tap listeners. Safe to call
   * more than once — every call after the first is a no-op — and returns an
   * unsubscribe, though the root layout keeps it for the app's whole lifetime.
   */
  setupListeners(): () => void {
    const messaging = messagingInstance();
    if (!messaging || listenersAttached) {
      return () => {};
    }
    listenersAttached = true;

    // Foreground: the OS never shows a banner for these, so the toast (via
    // ingest -> showNotificationToast) is the only surface the artist sees.
    const unsubscribeMessage = onMessage(messaging, async (message) => {
      const item = parseNotificationData(message);
      if (item) {
        useNotificationStore.getState().ingest(item);
      }
    });

    // Backgrounded, tapped: deep-link straight there.
    const unsubscribeOpened = onNotificationOpenedApp(messaging, (message) => {
      const item = parseNotificationData(message);
      if (item) {
        navigateToNotification(item);
      }
    });

    // Quit-state, tapped: same deep link, once the router has had a beat to mount.
    getInitialNotification(messaging)
      .then((message) => {
        if (!message) {
          return;
        }
        const item = parseNotificationData(message);
        if (item) {
          setTimeout(() => navigateToNotification(item), 300);
        }
      })
      .catch((error) => {
        logger.warn('getInitialNotification failed', { error: String(error) });
      });

    const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (token) => {
      currentToken = token;
      const result = await notificationApi.registerDevice({
        fcmToken: token,
        platform: platformName(),
      });
      if (!result.success) {
        logger.warn('Device re-registration failed', { error: result.error });
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
      listenersAttached = false;
    };
  },
};
