import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { API_CONFIG, SECURE_KEYS } from '@constants/app';
import { secureStorage } from '@services/storage';
import type { BroadcastActivityItem, FulfillmentUpdatedPayload } from '@app-types/broadcast';
import { logger } from '@utils/logger';

/**
 * SignalR connection to the broadcast hub (route: /hubs/broadcast). The host
 * joins their own broadcast group and receives live activity (chat,
 * reactions, rewards, fun-wheel), viewer-count changes, and fulfillment
 * updates — the same events the fan app listens to. Same auth pattern as the
 * private-message / notification hubs.
 */

const HUB_URL = `${API_CONFIG.baseUrl}/hubs/broadcast`;

export interface BroadcastHubHandlers {
  onActivityAdded?: (item: BroadcastActivityItem) => void;
  onViewerCountChanged?: (count: number) => void;
  onFulfillmentUpdated?: (payload: FulfillmentUpdatedPayload) => void;
  onBroadcastEnded?: (reason?: string) => void;
}

let connection: HubConnection | null = null;
let joinedId: string | null = null;

const getAccessToken = async (): Promise<string> =>
  (await secureStorage.get(SECURE_KEYS.accessToken)) ?? '';

export const broadcastHub = {
  /** Connect and join the broadcast group. Never throws. */
  async connect(broadcastId: string, handlers: BroadcastHubHandlers): Promise<void> {
    await this.disconnect();

    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: getAccessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ActivityAdded', (item: BroadcastActivityItem) => handlers.onActivityAdded?.(item));
    connection.on('ViewerCountChanged', (count: number) => handlers.onViewerCountChanged?.(count));
    connection.on('FulfillmentUpdated', (payload: FulfillmentUpdatedPayload) =>
      handlers.onFulfillmentUpdated?.(payload),
    );
    connection.on('BroadcastEnded', (payload: { reason?: string } | undefined) =>
      handlers.onBroadcastEnded?.(payload?.reason),
    );

    connection.onreconnected(() => {
      connection?.invoke('JoinBroadcast', broadcastId).catch(() => {});
    });

    try {
      await connection.start();
      await connection.invoke('JoinBroadcast', broadcastId);
      joinedId = broadcastId;
    } catch (error) {
      logger.warn('Broadcast hub failed to connect', { error: String(error) });
    }
  },

  async disconnect(): Promise<void> {
    const current = connection;
    const id = joinedId;
    connection = null;
    joinedId = null;
    if (!current) return;
    try {
      if (id && current.state === HubConnectionState.Connected) {
        await current.invoke('LeaveBroadcast', id).catch(() => {});
      }
      await current.stop();
    } catch (error) {
      logger.warn('Broadcast hub failed to stop cleanly', { error: String(error) });
    }
  },
};
