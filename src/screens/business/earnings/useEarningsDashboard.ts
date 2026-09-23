import type { UseQueryResult } from '@tanstack/react-query';

import { useEarningsSummary } from '@hooks/useInsights';
import type { EarningsSummary } from '@app-types/api';

export interface UseEarningsDashboardResult {
  data: EarningsSummary | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: UseQueryResult<EarningsSummary, Error>['refetch'];
}

/** All Earnings Dashboard data. The screen component renders state; it holds none. */
export const useEarningsDashboard = (): UseEarningsDashboardResult => {
  const { data, isLoading, error, refetch } = useEarningsSummary();
  return { data, isLoading, error, refetch };
};
