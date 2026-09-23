import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  useGroupCallAnalytics as useGroupCallAnalyticsQuery,
  useGroupCallHistoryPaged as useGroupCallHistoryPagedQuery,
  useGroupCallHistorySummary as useGroupCallHistorySummaryQuery,
} from '@hooks/useGroupCallHistory';
import type {
  GroupCallAnalytics,
  GroupCallHistoryFilter,
  GroupCallHistoryItem,
  GroupCallHistorySummary,
} from '@app-types/api';

/**
 * The same list, paged — the screen walks the pages as the artist scrolls.
 * The filter is part of the query key, so switching tabs starts a fresh page
 * walk rather than appending to the previous filter's rows. Refetches on
 * filter change.
 */
export const useGroupCallHistoryPaged = (
  filter: GroupCallHistoryFilter,
  pageSize: number,
): UseInfiniteQueryResult<InfiniteData<GroupCallHistoryItem[], number>, Error> =>
  useGroupCallHistoryPagedQuery(filter, pageSize);

/** Lifetime totals for the current status filter — DB-aggregated, filter-scoped. */
export const useGroupCallHistorySummary = (
  filter: GroupCallHistoryFilter,
): UseQueryResult<GroupCallHistorySummary, Error> => useGroupCallHistorySummaryQuery(filter);

/**
 * Requests / approvals / refunds + revenue breakdown for one call. `enabled`
 * so a call's analytics only fetch once the artist actually expands it.
 */
export const useGroupCallAnalytics = (
  groupCallId: string | null,
): UseQueryResult<GroupCallAnalytics, Error> => useGroupCallAnalyticsQuery(groupCallId);

export interface UseGroupCallHistoryResult {
  filter: GroupCallHistoryFilter;
  setFilter: (filter: GroupCallHistoryFilter) => void;
  expandedId: string | null;

  history: GroupCallHistoryItem[];
  loadingHistory: boolean;
  historyError: boolean;
  historyErrorObj: Error | null;
  refetchHistory: () => unknown;
  isRefetching: boolean;
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;

  summary: GroupCallHistorySummary | undefined;
  loadingSummary: boolean;

  analytics: GroupCallAnalytics | undefined;
  loadingAnalytics: boolean;

  isLoading: boolean;
  isEmpty: boolean;

  toggleExpand: (groupCallId: string) => void;
}

/** All group-call-history logic. The screen component renders state; it holds none. */
export const useGroupCallHistory = (pageSize: number): UseGroupCallHistoryResult => {
  const [filter, setFilter] = useState<GroupCallHistoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: historyPages,
    isLoading: loadingHistory,
    isError: historyError,
    error: historyErrorObj,
    refetch: refetchHistory,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGroupCallHistoryPaged(filter, pageSize);
  /** Every page walked so far, flattened into the single list the UI renders. */
  const history = useMemo(() => historyPages?.pages.flat() ?? [], [historyPages]);
  const { data: summary, isLoading: loadingSummary } = useGroupCallHistorySummary(filter);
  const { data: analytics, isLoading: loadingAnalytics } = useGroupCallAnalytics(expandedId);

  const toggleExpand = (groupCallId: string) =>
    setExpandedId((current) => (current === groupCallId ? null : groupCallId));

  const isLoading = loadingHistory || loadingSummary;
  const isEmpty = !history || history.length === 0;

  return {
    filter,
    setFilter,
    expandedId,
    history,
    loadingHistory,
    historyError,
    historyErrorObj,
    refetchHistory,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    summary,
    loadingSummary,
    analytics,
    loadingAnalytics,
    isLoading,
    isEmpty,
    toggleExpand,
  };
};
