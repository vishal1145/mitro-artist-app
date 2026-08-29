import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { API_CONFIG, NOTIFICATIONS, SECURE_KEYS } from '@constants/app';
import { secureStorage } from '@services/storage';
import type { NotificationItem } from '@app-types/api';
import { logger } from '@utils/logger';

/**
 * SignalR connection to the artist notification hub.
 *
 * Same auth pattern as the REST client: the JWT lives in secure storage, not
 * in this module, so `accessTokenFactory` reads it fresh on every
 * connect/reconnect attempt — a token refreshed mid-session is picked up
 * automatically rather than baked in at construction time.
 */

const HUB_URL = `${API_CONFIG.baseUrl}${NOTIFICATIONS.hubPath}`;

let connection: HubConnection | null = null;
let handler: ((item: NotificationItem) => void) | null = null;

const getAccessToken = async (): Promise<string> =>
  (await secureStorage.get(SECURE_KEYS.accessToken)) ?? '';

const buildConnection = (): HubConnection =>
  new HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: getAccessToken })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

export const notificationHub = {
  /** Set (or clear, with `null`) the callback fired on `NotificationReceived`. */
  setHandler(next: ((item: NotificationItem) => void) | null): void {
    handler = next;
  },

  /** Connect (or no-op if already connected/connecting). Never throws. */
  async connect(): Promise<void> {
    if (connection && connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    connection = buildConnection();

    connection.on(NOTIFICATIONS.hubEvent, (payload: NotificationItem) => {
      handler?.(payload);
    });

    connection.onreconnected(() => {
      logger.info('Notification hub reconnected');
    });

    connection.onclose((error) => {
      if (error) {
        logger.warn('Notification hub closed', { error: String(error) });
      }
    });

    try {
      await connection.start();
    } catch (error) {
      // Best-effort: a signed-in artist without a live hub connection still
      // gets notifications via the REST list/unread-count on refresh.
      logger.warn('Notification hub failed to connect', { error: String(error) });
    }
  },

  async disconnect(): Promise<void> {
    const current = connection;
    connection = null;
    if (!current) {
      return;
    }
    try {
      await current.stop();
    } catch (error) {
      logger.warn('Notification hub failed to stop cleanly', { error: String(error) });
    }
  },
};
