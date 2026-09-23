import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  useBroadcastAnalytics as useBroadcastAnalyticsQuery,
  useBroadcastHistoryPaged as useBroadcastHistoryPagedQuery,
  useBroadcastHistorySummary as useBroadcastHistorySummaryQuery,
} from '@hooks/useInsights';
import { useFulfillRewardOrderMutation, usePendingRewardOrders } from '@hooks/useRewardOrders';
import type {
  BroadcastAnalytics,
  BroadcastHistoryItem,
  BroadcastHistorySummary,
  RewardOrder,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { showToast } from '@utils/toast';

/** `useBroadcastHistoryPaged` re-exported at the page size this screen uses. */
export const useBroadcastHistoryPaged = (
  pageSize: number,
): UseInfiniteQueryResult<InfiniteData<BroadcastHistoryItem[], number>, Error> =>
  useBroadcastHistoryPagedQuery(pageSize);

export const useBroadcastHistorySummary = (): UseQueryResult<BroadcastHistorySummary, Error> =>
  useBroadcastHistorySummaryQuery();

export const useBroadcastAnalytics = (
  broadcastId: string | null,
): UseQueryResult<BroadcastAnalytics, Error> => useBroadcastAnalyticsQuery(broadcastId);

export interface UseBroadcastHistoryResult {
  expandedId: string | null;
  fulfillingId: string | null;

  history: BroadcastHistoryItem[];
  loadingHistory: boolean;
  historyError: boolean;
  historyErrorObj: Error | null;
  refetchHistory: () => unknown;
  isRefetching: boolean;
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;

  loadingSummary: boolean;
  summary: BroadcastHistorySummary | undefined;

  pendingOrders: RewardOrder[] | undefined;
  loadingOrders: boolean;
  hasPending: boolean;

  analytics: BroadcastAnalytics | undefined;
  loadingAnalytics: boolean;

  toggleAnalytics: (broadcastId: string) => void;
  handleFulfill: (order: RewardOrder) => Promise<void>;
}

/** All broadcast-history logic. The screen component renders state; it holds none. */
export const useBroadcastHistory = (pageSize: number): UseBroadcastHistoryResult => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

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
  } = useBroadcastHistoryPaged(pageSize);
  /** Every page walked so far, flattened into the single list the UI renders. */
  const history = useMemo(() => historyPages?.pages.flat() ?? [], [historyPages]);
  const { data: summary, isLoading: loadingSummary } = useBroadcastHistorySummary();
  const { data: pendingOrders, isLoading: loadingOrders } = usePendingRewardOrders();
  const { data: analytics, isLoading: loadingAnalytics } = useBroadcastAnalytics(expandedId);
  const fulfillMutation = useFulfillRewardOrderMutation();

  const toggleAnalytics = (broadcastId: string) =>
    setExpandedId((current) => (current === broadcastId ? null : broadcastId));

  const handleFulfill = async (order: RewardOrder) => {
    setFulfillingId(order.id);
    try {
      const result = await fulfillMutation.mutateAsync(order.id);
      showToast(
        result.message ?? `Marked "${order.rewardName}" as delivered to ${order.buyerDisplayName}.`,
        'success',
      );
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setFulfillingId(null);
    }
  };

  const hasPending = !loadingOrders && !!pendingOrders && pendingOrders.length > 0;

  return {
    expandedId,
    fulfillingId,
    history,
    loadingHistory,
    historyError,
    historyErrorObj,
    refetchHistory,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadingSummary,
    summary,
    pendingOrders,
    loadingOrders,
    hasPending,
    analytics,
    loadingAnalytics,
    toggleAnalytics,
    handleFulfill,
  };
};
