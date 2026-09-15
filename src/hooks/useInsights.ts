import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { insightsApi } from '@services/api';
import type {
  BroadcastAnalytics,
  BroadcastHistoryItem,
  BroadcastHistorySummary,
  EarningsSummary,
  EarningsTransaction,
} from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * Earnings totals for the dashboard.
 *
 * Short `staleTime` — tokens move while the artist is live, and this drives
 * the headline numbers on Home. `retry: false` because the only realistic
 * failure is an expired token, which the axios interceptor already handles.
 */
export const useEarningsSummary = (): UseQueryResult<EarningsSummary, Error> =>
  useQuery({
    queryKey: queryKeys.earnings.summary(),
    queryFn: async () => {
      const result = await insightsApi.getEarningsSummary();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 30_000,
    retry: false,
  });

/** The coin ledger, newest first. Drives the Transactions screen. */
export const useEarningsTransactions = (
  take = 100,
  skip = 0,
): UseQueryResult<EarningsTransaction[], Error> =>
  useQuery({
    queryKey: queryKeys.earnings.transactions(take, skip),
    queryFn: async () => {
      const result = await insightsApi.getEarningsTransactions({ take, skip });
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 30_000,
    retry: false,
  });

/** Past broadcasts, newest first. */
export const useBroadcastHistory = (
  take = 5,
  skip = 0,
): UseQueryResult<BroadcastHistoryItem[], Error> =>
  useQuery({
    queryKey: queryKeys.broadcast.history(take, skip),
    queryFn: async () => {
      const result = await insightsApi.getBroadcastHistory({ take, skip });
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });

/**
 * Lifetime broadcast totals for the Broadcast History header strip —
 * DB-aggregated, so it stays correct beyond whatever page of `history` is
 * currently loaded.
 */
export const useBroadcastHistorySummary = (): UseQueryResult<
  BroadcastHistorySummary,
  Error
> =>
  useQuery({
    queryKey: queryKeys.broadcast.historySummary(),
    queryFn: async () => {
      const result = await insightsApi.getBroadcastHistorySummary();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });

/**
 * Chat / reward / fun-wheel breakdown for one broadcast. `enabled` so a row's
 * analytics only fetch once the artist actually expands it.
 */
export const useBroadcastAnalytics = (
  broadcastId: string | null,
): UseQueryResult<BroadcastAnalytics, Error> =>
  useQuery({
    queryKey: queryKeys.broadcast.analytics(broadcastId ?? ''),
    queryFn: async () => {
      const result = await insightsApi.getBroadcastAnalytics(broadcastId as string);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    enabled: !!broadcastId,
    staleTime: 60_000,
    retry: false,
  });
