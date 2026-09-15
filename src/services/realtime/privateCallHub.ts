import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { API_CONFIG, SECURE_KEYS } from '@constants/app';
import { secureStorage } from '@services/storage';
import type {
  CallCostUpdatePayload,
  PrivateCallFunWheelPush,
  PrivateCallRewardPush,
} from '@app-types/privateCall';
import type { FulfillmentUpdatedPayload } from '@app-types/broadcast';
import { logger } from '@utils/logger';

/**
 * SignalR connection to the private-call hub (route: /hubs/private-call). The
 * artist joins the call group to receive per-minute cost updates, reward /
 * fun-wheel purchases, fulfillment updates, the fan's reconnect state, and the
 * call-ended signal. Same auth pattern as the other hubs.
 */

const HUB_URL = `${API_CONFIG.baseUrl}/hubs/private-call`;

export interface PrivateCallHubHandlers {
  /** Both sides are in the channel and billing has started. */
  onCallStarted?: () => void;
  onCallCostUpdate?: (payload: CallCostUpdatePayload) => void;
  /** Reward bought mid-call — the payload is enough to render it, no refetch. */
  onRewardPurchased?: (payload: PrivateCallRewardPush) => void;
  onFunWheelSpun?: (payload: PrivateCallFunWheelPush) => void;
  onFulfillmentUpdated?: (payload: FulfillmentUpdatedPayload) => void;
  onUserReconnecting?: () => void;
  onUserReconnected?: () => void;
  /** The backend is winding the call down, e.g. the fan ran out of balance. */
  onCallEnding?: (reason: string) => void;
  onPrivateCallEnded?: (reason?: string) => void;
}

let connection: HubConnection | null = null;
let joinedId: string | null = null;

const getAccessToken = async (): Promise<string> =>
  (await secureStorage.get(SECURE_KEYS.accessToken)) ?? '';

export const privateCallHub = {
  async connect(
    privateCallId: string,
    handlers: PrivateCallHubHandlers,
  ): Promise<void> {
    await this.disconnect();

    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: getAccessToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Event + group-join names are the ones the artist web talks to
    // (PrivateCallActiveScreen / createPrivateCallHubConnection) — the server
    // contract is `JoinCall`/`LeaveCall` and `AdditionalMinuteCharged`.
    connection.on('PrivateCallStarted', () => handlers.onCallStarted?.());
    connection.on('AdditionalMinuteCharged', (p: CallCostUpdatePayload) =>
      handlers.onCallCostUpdate?.(p),
    );
    connection.on('RewardPurchased', (p: PrivateCallRewardPush) =>
      handlers.onRewardPurchased?.(p),
    );
    connection.on('FunWheelSpun', (p: PrivateCallFunWheelPush) =>
      handlers.onFunWheelSpun?.(p),
    );
    connection.on('FulfillmentUpdated', (p: FulfillmentUpdatedPayload) =>
      handlers.onFulfillmentUpdated?.(p),
    );
    connection.on('UserDisconnected', () => handlers.onUserReconnecting?.());
    connection.on('UserReconnected', () => handlers.onUserReconnected?.());
    connection.on('PrivateCallEnding', (p: { reason?: string } | undefined) =>
      handlers.onCallEnding?.(p?.reason ?? ''),
    );
    connection.on('PrivateCallEnded', (p: { reason?: string } | undefined) =>
      handlers.onPrivateCallEnded?.(p?.reason),
    );

    connection.onreconnected(() => {
      connection?.invoke('JoinCall', privateCallId).catch(() => {});
    });

    try {
      await connection.start();
      await connection.invoke('JoinCall', privateCallId);
      joinedId = privateCallId;
    } catch (error) {
      logger.warn('Private call hub failed to connect', {
        error: String(error),
      });
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
        await current.invoke('LeaveCall', id).catch(() => {});
      }
      await current.stop();
    } catch (error) {
      logger.warn('Private call hub failed to stop cleanly', {
        error: String(error),
      });
    }
  },
};
