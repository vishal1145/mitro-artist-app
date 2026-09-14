import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { rewardOrdersApi } from '@services/api';
import type { MessageResponse, RewardOrder } from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/** Fan-purchased rewards (shoutouts, song requests, …) still waiting on delivery. */
export const usePendingRewardOrders = (): UseQueryResult<RewardOrder[], Error> =>
  useQuery({
    queryKey: queryKeys.rewardOrders.pending(),
    queryFn: async () => {
      const result = await rewardOrdersApi.list({ status: 'pending', take: 50 });
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 30_000,
    retry: false,
  });

/** Marks a reward order fulfilled; invalidates the pending queue on success. */
export const useFulfillRewardOrderMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['rewardOrders', 'fulfill'],
    mutationFn: async (orderId: string) => {
      const result = await rewardOrdersApi.fulfill(orderId);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewardOrders.all });
    },
    retry: false,
  });
};
