import type {
  BroadcastHistoryItem,
  BroadcastHistoryQuery,
  EarningsSummary,
  Result,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Read-only dashboard data: earnings totals and past broadcasts.
 *
 * Same `Result<T>` contract as the other services — nothing in here throws.
 */
export const insightsApi = {
  async getEarningsSummary(): Promise<Result<EarningsSummary>> {
    try {
      const res = await api.get<EarningsSummary>(ENDPOINTS.earnings.summary);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Newest first. Bare array — no envelope, no total count. */
  async getBroadcastHistory(
    query: BroadcastHistoryQuery,
  ): Promise<Result<BroadcastHistoryItem[]>> {
    try {
      const res = await api.get<BroadcastHistoryItem[]>(
        ENDPOINTS.broadcast.history,
        { params: query },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
