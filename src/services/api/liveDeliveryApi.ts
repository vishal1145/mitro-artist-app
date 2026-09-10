import type { Result } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

export interface RewardOrder {
  id: string;
  broadcastId: string;
  userId: string;
  buyerDisplayName: string;
  rewardName: string;
  priceCharged: number;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface FunWheelSpinOrder {
  id: string;
  sessionType: 'broadcast' | 'group_call' | 'private_call';
  sessionId: string;
  userId: string;
  buyerDisplayName: string;
  activityName: string;
  priceCharged: number;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

/** Reward-order + fun-wheel-spin fulfillment — the host's delivery queue,
 * matching the artist web's rewardOrdersService / funWheelSpinsService. */
export const rewardOrdersApi = {
  async list(status: string | null = 'pending', take = 100, broadcastId?: string): Promise<Result<RewardOrder[]>> {
    try {
      const res = await api.get<RewardOrder[]>(ENDPOINTS.rewardOrders.list, {
        params: { status: status ?? '', take, ...(broadcastId ? { broadcastId } : {}) },
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
  async fulfill(orderId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.rewardOrders.fulfill(orderId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};

export const funWheelSpinsApi = {
  async list(status: string | null = 'pending', take = 100, sessionId?: string): Promise<Result<FunWheelSpinOrder[]>> {
    try {
      const res = await api.get<FunWheelSpinOrder[]>(ENDPOINTS.funWheelSpins.list, {
        params: { status: status ?? '', take, ...(sessionId ? { sessionId } : {}) },
      });
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
  async fulfill(spinId: string): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.funWheelSpins.fulfill(spinId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
