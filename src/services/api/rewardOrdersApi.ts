import type { MessageResponse, Result, RewardOrder } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

export interface RewardOrdersQuery {
  /** Defaults to "pending" — the fulfillment queue. Pass null for every status. */
  status?: string | null;
  take?: number;
  broadcastId?: string;
}

/** Fan-purchased rewards (shoutouts, song requests, …) awaiting fulfillment. */
export const rewardOrdersApi = {
  async list(query: RewardOrdersQuery = {}): Promise<Result<RewardOrder[]>> {
    const { status = 'pending', take = 50, broadcastId } = query;
    try {
      const res = await api.get<RewardOrder[]>(ENDPOINTS.rewardOrders.list, {
        params: { status: status ?? '', take, ...(broadcastId ? { broadcastId } : {}) },
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async fulfill(orderId: string): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(ENDPOINTS.rewardOrders.fulfill(orderId));
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
