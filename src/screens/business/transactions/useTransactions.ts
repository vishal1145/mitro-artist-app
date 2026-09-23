import { useMemo, useState } from 'react';

import { useEarningsSummary, useEarningsTransactionsPaged } from '@hooks/useInsights';
import type { EarningsSummary, EarningsTransaction } from '@app-types/api';

import type { TxFilter } from './types';

export interface UseTransactionsResult {
  filter: TxFilter;
  setFilter: (filter: TxFilter) => void;

  transactions: EarningsTransaction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => unknown;
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;

  summary: EarningsSummary | undefined;
  loadingSummary: boolean;
  pendingTokens: number;
  settledTokens: number;
  weekTokens: number;

  filtered: EarningsTransaction[];
}

/** All Transaction History logic. The screen component renders state; it holds none. */
export const useTransactions = (pageSize: number): UseTransactionsResult => {
  const [filter, setFilter] = useState<TxFilter>('all');

  /*
   * The web asks for a flat `getTransactions(100)` and stops; this walks the
   * ledger a page at a time so older rows stay reachable. Everything below —
   * the four summary tiles and the filters — is computed over the pages loaded
   * so far, which for the first page matches the web exactly.
   */
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEarningsTransactionsPaged(pageSize);

  const transactions = useMemo(() => data?.pages.flat() ?? [], [data]);

  /*
   * The four tiles come from `GET /api/artist/earnings/summary`, NOT from the
   * rows on screen.
   *
   * They are whole-ledger figures — this artist has 1,179 transactions — so
   * adding up whatever page happens to be loaded gives a number that is both
   * wrong and drifts as you scroll. The server already aggregates them, and
   * excludes refunded/reversed rows while doing it (EarningsController's
   * `liveRows` filter), which is the same rule the list applies per row.
   */
  const { data: summary, isLoading: loadingSummary } = useEarningsSummary();

  const pendingTokens = summary?.pendingTokens ?? 0;
  const settledTokens = (summary?.availableTokens ?? 0) + (summary?.paidOutTokens ?? 0);
  /** `last7Days` is server-computed, oldest first, zero-filled to seven entries. */
  const weekTokens = useMemo(
    () => (summary?.last7Days ?? []).reduce((sum, d) => sum + d.tokens, 0),
    [summary],
  );

  const filtered = useMemo(() => {
    const all = transactions ?? [];
    if (filter === 'pending') {
      return all.filter((t) => t.status === 'pending');
    }
    if (filter === 'settled') {
      return all.filter((t) => t.status === 'available' || t.status === 'paid_out');
    }
    if (filter === 'refunded') {
      return all.filter((t) => t.status === 'refunded' || t.status === 'reversed');
    }
    return all;
  }, [transactions, filter]);

  return {
    filter,
    setFilter,
    transactions,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    summary,
    loadingSummary,
    pendingTokens,
    settledTokens,
    weekTokens,
    filtered,
  };
};
