import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
  type UseQueryResult,
} from '@tanstack/react-query';

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

/**
 * The same ledger, paged.
 *
 * `GET /api/artist/earnings/transactions` takes `take` + `skip`; the web only
 * ever asks for the first 100 and stops, so anything older than that is simply
 * unreachable there. Here the Transactions screen walks the pages, asking for
 * the next one when the artist reaches the end of the list.
 *
 * A short page (fewer rows than `pageSize`) means the ledger is exhausted, so
 * `getNextPageParam` returns undefined and `hasNextPage` goes false.
 */
export const useEarningsTransactionsPaged = (
  pageSize = 25,
): UseInfiniteQueryResult<InfiniteData<EarningsTransaction[], number>, Error> =>
  useInfiniteQuery({
    queryKey: [...queryKeys.earnings.all, 'transactions', 'paged', pageSize] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await insightsApi.getEarningsTransactions({
        take: pageSize,
        skip: pageParam,
      });
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length * pageSize,
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
 * The same broadcast list, paged.
 *
 * `GET /api/artist/broadcast/history` takes `take` + `skip`. The screen walks
 * the pages as the artist scrolls, exactly like the Transactions ledger: a
 * short page means the history is exhausted, so `getNextPageParam` returns
 * undefined and `hasNextPage` goes false.
 */
export const useBroadcastHistoryPaged = (
  pageSize = 20,
): UseInfiniteQueryResult<InfiniteData<BroadcastHistoryItem[], number>, Error> =>
  useInfiniteQuery({
    queryKey: [...queryKeys.broadcast.all, 'history', 'paged', pageSize] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await insightsApi.getBroadcastHistory({
        take: pageSize,
        skip: pageParam,
      });
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length * pageSize,
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
