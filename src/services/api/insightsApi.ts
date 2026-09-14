import type {
  BroadcastAnalytics,
  BroadcastHistoryItem,
  BroadcastHistoryQuery,
  BroadcastHistorySummary,
  EarningsSummary,
  EarningsTransaction,
  EarningsTransactionsQuery,
  GroupCallAnalytics,
  GroupCallHistoryItem,
  GroupCallHistoryQuery,
  GroupCallHistorySummary,
  GroupCallHistoryFilter,
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

  /** The coin ledger, newest first. Bare array — no envelope. */
  async getEarningsTransactions(
    query: EarningsTransactionsQuery,
  ): Promise<Result<EarningsTransaction[]>> {
    try {
      const res = await api.get<EarningsTransaction[]>(
        ENDPOINTS.earnings.transactions,
        { params: query },
      );
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

  /**
   * Lifetime broadcast totals — DB-aggregated, so it stays correct beyond
   * whatever page `getBroadcastHistory` last fetched.
   */
  async getBroadcastHistorySummary(): Promise<Result<BroadcastHistorySummary>> {
    try {
      const res = await api.get<BroadcastHistorySummary>(
        ENDPOINTS.broadcast.historySummary,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Chat/reaction/reward/fun-wheel breakdown for one broadcast. */
  async getBroadcastAnalytics(
    broadcastId: string,
  ): Promise<Result<BroadcastAnalytics>> {
    try {
      const res = await api.get<BroadcastAnalytics>(
        ENDPOINTS.broadcast.analytics(broadcastId),
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Newest first. The server does the status filtering, not the client. */
  async getGroupCallHistory(
    query: GroupCallHistoryQuery,
  ): Promise<Result<GroupCallHistoryItem[]>> {
    try {
      const res = await api.get<GroupCallHistoryItem[]>(
        ENDPOINTS.groupCall.history,
        { params: query },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Lifetime group-call totals for the current status filter. */
  async getGroupCallHistorySummary(
    status: GroupCallHistoryFilter,
  ): Promise<Result<GroupCallHistorySummary>> {
    try {
      const res = await api.get<GroupCallHistorySummary>(
        ENDPOINTS.groupCall.historySummary,
        { params: { status } },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Requests/approvals/refunds + revenue breakdown for one group call. */
  async getGroupCallAnalytics(
    groupCallId: string,
  ): Promise<Result<GroupCallAnalytics>> {
    try {
      const res = await api.get<GroupCallAnalytics>(
        ENDPOINTS.groupCall.analytics(groupCallId),
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
