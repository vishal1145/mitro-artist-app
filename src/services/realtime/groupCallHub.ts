import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { API_CONFIG, SECURE_KEYS } from '@constants/app';
import { secureStorage } from '@services/storage';
import type { FulfillmentUpdatedPayload, GroupCallActivityItem } from '@app-types/groupCall';
import { logger } from '@utils/logger';

/**
 * SignalR connection to the group-call hub (route: /hubs/group-call). The host
 * joins their call group and receives join requests, participant changes,
 * live activity (chat/reactions/rewards), and fulfillment updates. Same auth
 * pattern as the other hubs.
 */

const HUB_URL = `${API_CONFIG.baseUrl}/hubs/group-call`;

export interface GroupCallHubHandlers {
  onActivityAdded?: (item: GroupCallActivityItem) => void;
  onParticipantRequested?: (userId: string) => void;
  onParticipantsChanged?: () => void;
  onParticipantStatusChanged?: (userId: string, status: string) => void;
  onFulfillmentUpdated?: (payload: FulfillmentUpdatedPayload) => void;
  onGroupCallEnded?: (reason?: string) => void;
}

let connection: HubConnection | null = null;
let joinedId: string | null = null;

const getAccessToken = async (): Promise<string> =>
  (await secureStorage.get(SECURE_KEYS.accessToken)) ?? '';

export const groupCallHub = {
  async connect(groupCallId: string, handlers: GroupCallHubHandlers): Promise<void> {
    await this.disconnect();

    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: getAccessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ActivityAdded', (item: GroupCallActivityItem) => handlers.onActivityAdded?.(item));
    connection.on('ParticipantRequested', (p: { userId: string }) =>
      handlers.onParticipantRequested?.(p?.userId),
    );
    connection.on('ParticipantsChanged', () => handlers.onParticipantsChanged?.());
    connection.on('ParticipantStatusChanged', (p: { userId: string; status: string }) =>
      handlers.onParticipantStatusChanged?.(p?.userId, p?.status),
    );
    connection.on('FulfillmentUpdated', (payload: FulfillmentUpdatedPayload) =>
      handlers.onFulfillmentUpdated?.(payload),
    );
    connection.on('GroupCallEnded', (p: { reason?: string } | undefined) =>
      handlers.onGroupCallEnded?.(p?.reason),
    );

    connection.onreconnected(() => {
      connection?.invoke('JoinGroupCall', groupCallId).catch(() => {});
    });

    try {
      await connection.start();
      await connection.invoke('JoinGroupCall', groupCallId);
      joinedId = groupCallId;
    } catch (error) {
      logger.warn('Group call hub failed to connect', { error: String(error) });
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
        await current.invoke('LeaveGroupCall', id).catch(() => {});
      }
      await current.stop();
    } catch (error) {
      logger.warn('Group call hub failed to stop cleanly', { error: String(error) });
    }
  },
};
