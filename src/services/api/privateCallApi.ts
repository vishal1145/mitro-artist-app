import type { Result } from '@app-types/api';
import type {
  PrivateCallActiveSession,
  PrivateCallConnectionResponse,
  PrivateCallHistoryItem,
  PrivateCallRequestItem,
} from '@app-types/privateCall';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

const newIdempotencyKey = (): string =>
  `pc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/** Private (1:1) calls — artist side. Same `Result<T>` contract as the other
 * services. Realtime half is in @services/realtime/privateCallHub. */
export const privateCallApi = {
  /** Turn 1:1 calls on/off and set the per-minute price. Fans can only send
   * requests while `acceptsPrivateCalls` is true. */
  async setSettings(
    acceptsPrivateCalls: boolean,
    pricePerMinute?: number | null,
  ): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.privateCall.settings, {
        acceptsPrivateCalls,
        pricePerMinute,
      });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Pending incoming call requests waiting on the artist. */
  async getRequests(): Promise<Result<PrivateCallRequestItem[]>> {
    try {
      const res = await api.get<PrivateCallRequestItem[]>(
        ENDPOINTS.privateCall.requests,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Accept a request → returns the Agora channel/uid/token to join the call. */
  async acceptRequest(
    requestId: string,
  ): Promise<Result<PrivateCallConnectionResponse>> {
    try {
      const res = await api.post<PrivateCallConnectionResponse>(
        ENDPOINTS.privateCall.accept(requestId),
        undefined,
        { headers: { 'Idempotency-Key': newIdempotencyKey() } },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async rejectRequest(
    requestId: string,
    reason?: string,
  ): Promise<Result<null>> {
    try {
      await api.post(
        ENDPOINTS.privateCall.reject(requestId),
        reason ? { reason } : {},
      );
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Fresh publisher token for the SAME call (reconnect). */
  async connect(
    privateCallId: string,
  ): Promise<Result<PrivateCallConnectionResponse>> {
    try {
      const res = await api.post<PrivateCallConnectionResponse>(
        ENDPOINTS.privateCall.connect(privateCallId),
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async end(privateCallId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(
        ENDPOINTS.privateCall.end(privateCallId),
        reason ? { reason } : {},
      );
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async reportConnectionLost(privateCallId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.privateCall.connectionLost(privateCallId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async heartbeat(privateCallId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.privateCall.heartbeat(privateCallId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Past 1:1 calls, newest first. `take`/`skip` page the list. */
  async getHistory(
    take = 20,
    skip = 0,
  ): Promise<Result<PrivateCallHistoryItem[]>> {
    try {
      const res = await api.get<PrivateCallHistoryItem[]>(
        ENDPOINTS.privateCall.history,
        {
          params: { take, skip },
        },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getActive(): Promise<Result<PrivateCallActiveSession>> {
    try {
      const res = await api.get<PrivateCallActiveSession>(
        ENDPOINTS.privateCall.active,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
