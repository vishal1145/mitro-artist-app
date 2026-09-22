import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { API_CONFIG, SECURE_KEYS } from '@constants/app';
import { secureStorage } from '@services/storage';
import type { PrivateMessageItem } from '@app-types/api';
import { logger } from '@utils/logger';

/**
 * SignalR connection to the private-message hub (route: /hubs/private-message).
 * Conversation-scoped: the chat screen connects with its (artistId, userId)
 * pair, joins that conversation group, and receives "PrivateMessageReceived"
 * the instant a fan sends — no polling. Same auth pattern as notificationHub.
 */

const HUB_URL = `${API_CONFIG.baseUrl}/hubs/private-message`;
const EVENT = 'PrivateMessageReceived';
/** "Delete for everyone" from either side — payload `{ messageId }`. */
const DELETED_EVENT = 'PrivateMessageDeleted';

export type PrivateMessageDeletedPayload = { messageId: string };

/** Server payload for a received message (a superset of PrivateMessageItem). */
export type PrivateMessageReceivedPayload = Pick<
  PrivateMessageItem,
  'id' | 'senderType' | 'messageText' | 'privateCallId' | 'priceCharged' | 'createdAtUtc'
> & { senderDisplayName?: string };

let connection: HubConnection | null = null;
let joined: { artistId: string; userId: string } | null = null;

const getAccessToken = async (): Promise<string> =>
  (await secureStorage.get(SECURE_KEYS.accessToken)) ?? '';

export const privateMessageHub = {
  /**
   * Connect and join the (artistId, userId) conversation. `onMessage` fires on
   * every new message pushed to the thread. Never throws.
   */
  async connect(
    artistId: string,
    userId: string,
    onMessage: (payload: PrivateMessageReceivedPayload) => void,
    onDeleted?: (payload: PrivateMessageDeletedPayload) => void,
  ): Promise<void> {
    // Tear down any previous conversation first.
    await this.disconnect();

    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: getAccessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on(EVENT, (payload: PrivateMessageReceivedPayload) => onMessage(payload));
    if (onDeleted) {
      connection.on(DELETED_EVENT, (payload: PrivateMessageDeletedPayload) => {
        if (payload?.messageId) onDeleted(payload);
      });
    }

    connection.onreconnected(() => {
      connection?.invoke('JoinConversation', artistId, userId).catch(() => {});
    });

    try {
      await connection.start();
      await connection.invoke('JoinConversation', artistId, userId);
      joined = { artistId, userId };
    } catch (error) {
      logger.warn('Private message hub failed to connect', { error: String(error) });
    }
  },

  async disconnect(): Promise<void> {
    const current = connection;
    const pair = joined;
    connection = null;
    joined = null;
    if (!current) return;
    try {
      if (pair && current.state === HubConnectionState.Connected) {
        await current.invoke('LeaveConversation', pair.artistId, pair.userId).catch(() => {});
      }
      await current.stop();
    } catch (error) {
      logger.warn('Private message hub failed to stop cleanly', { error: String(error) });
    }
  },
};
