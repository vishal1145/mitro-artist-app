import type { Result } from '@app-types/api';
import type {
  BroadcastActivityItem,
  BroadcastAnalytics,
  ListViewersResponse,
  StartBroadcastRequest,
  StartBroadcastResponse,
} from '@app-types/broadcast';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Live broadcasting — artist (host) side. Same `Result<T>` contract as the
 * other services (nothing throws). The realtime half is in
 * @services/realtime/broadcastHub.
 */
export const broadcastApi = {
  /** Go live — returns the Agora channel/uid/token for the host to publish. */
  async start(payload: StartBroadcastRequest): Promise<Result<StartBroadcastResponse>> {
    try {
      const res = await api.post<StartBroadcastResponse>(ENDPOINTS.broadcast.start, payload);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Tell the backend the host's Agora connection is up (flips status → live). */
  async confirmConnected(broadcastId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.confirmConnected(broadcastId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Fresh publisher token for the SAME channel after a client-side reload. */
  async rejoin(broadcastId: string): Promise<Result<StartBroadcastResponse>> {
    try {
      const res = await api.post<StartBroadcastResponse>(ENDPOINTS.broadcast.rejoin(broadcastId));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async reportConnectionLost(broadcastId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.connectionLost(broadcastId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async heartbeat(broadcastId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.heartbeat(broadcastId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async end(broadcastId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.end(broadcastId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getViewers(broadcastId: string): Promise<Result<ListViewersResponse>> {
    try {
      const res = await api.get<ListViewersResponse>(ENDPOINTS.broadcast.viewers(broadcastId));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getActivity(broadcastId: string, take = 100): Promise<Result<BroadcastActivityItem[]>> {
    try {
      const res = await api.get<BroadcastActivityItem[]>(ENDPOINTS.broadcast.activity(broadcastId), {
        params: { take },
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Host posts their own chat message into the live broadcast. */
  async sendChatMessage(
    broadcastId: string,
    messageText: string,
  ): Promise<Result<{ message: string; id: string; createdAtUtc: string }>> {
    try {
      const res = await api.post<{ message: string; id: string; createdAtUtc: string }>(
        ENDPOINTS.broadcast.chat(broadcastId),
        { messageText },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async muteViewer(broadcastId: string, userId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.muteViewer(broadcastId, userId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async unmuteViewer(broadcastId: string, userId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.unmuteViewer(broadcastId, userId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async removeViewer(broadcastId: string, userId: string, reason?: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.broadcast.removeViewer(broadcastId, userId), reason ? { reason } : {});
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async setHighlightedMessagePrice(broadcastId: string, price: number): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.broadcast.highlightedPrice(broadcastId), { price });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async getAnalytics(broadcastId: string): Promise<Result<BroadcastAnalytics>> {
    try {
      const res = await api.get<BroadcastAnalytics>(ENDPOINTS.broadcast.analytics(broadcastId));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
