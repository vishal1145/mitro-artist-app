import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { insightsApi } from '@services/api';
import type { BroadcastHistoryItem, EarningsSummary } from '@app-types/api';
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
