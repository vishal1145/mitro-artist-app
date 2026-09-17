import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { insightsApi } from '@services/api';
import type {
  GroupCallAnalytics,
  GroupCallHistoryFilter,
  GroupCallHistoryItem,
  GroupCallHistorySummary,
} from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/** Past group calls for the current status filter, newest first. */
export const useGroupCallHistory = (
  filter: GroupCallHistoryFilter,
  take = 30,
  skip = 0,
): UseQueryResult<GroupCallHistoryItem[], Error> =>
  useQuery({
    queryKey: queryKeys.groupCall.history(take, skip, filter),
    queryFn: async () => {
      const result = await insightsApi.getGroupCallHistory({ take, skip, status: filter });
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });

/**
 * The same list, paged — the screen walks the pages as the artist scrolls,
 * exactly like the Transactions ledger. The filter is part of the query key,
 * so switching tabs starts a fresh page walk rather than appending to the
 * previous filter's rows.
 */
export const useGroupCallHistoryPaged = (
  filter: GroupCallHistoryFilter,
  pageSize = 20,
): UseInfiniteQueryResult<InfiniteData<GroupCallHistoryItem[], number>, Error> =>
  useInfiniteQuery({
    queryKey: [
      ...queryKeys.groupCall.all,
      'history',
      'paged',
      pageSize,
      filter,
    ] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await insightsApi.getGroupCallHistory({
        take: pageSize,
        skip: pageParam,
        status: filter,
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

/** Lifetime totals for the current status filter — DB-aggregated. */
export const useGroupCallHistorySummary = (
  filter: GroupCallHistoryFilter,
): UseQueryResult<GroupCallHistorySummary, Error> =>
  useQuery({
    queryKey: queryKeys.groupCall.historySummary(filter),
    queryFn: async () => {
      const result = await insightsApi.getGroupCallHistorySummary(filter);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });

/**
 * Requests / approvals / refunds + revenue breakdown for one call. `enabled`
 * so a call's analytics only fetch once the artist actually expands it.
 */
export const useGroupCallAnalytics = (
  groupCallId: string | null,
): UseQueryResult<GroupCallAnalytics, Error> =>
  useQuery({
    queryKey: queryKeys.groupCall.analytics(groupCallId ?? ''),
    queryFn: async () => {
      const result = await insightsApi.getGroupCallAnalytics(groupCallId as string);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    enabled: !!groupCallId,
    staleTime: 60_000,
    retry: false,
  });
