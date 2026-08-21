import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { settingsApi } from '@services/api';
import type {
  CreateActivityPayload,
  CreateRewardPayload,
  FunWheel,
  RewardMenuItem,
} from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * Reward menu and fun wheel.
 *
 * Both change only when the artist edits them, so they're cached for a few
 * minutes rather than refetched on every visit to Settings.
 */
export const useRewardMenu = (): UseQueryResult<RewardMenuItem[], Error> =>
  useQuery({
    queryKey: queryKeys.settings.rewardMenu(),
    queryFn: async () => {
      const result = await settingsApi.getRewardMenu();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

export const useFunWheel = (): UseQueryResult<FunWheel, Error> =>
  useQuery({
    queryKey: queryKeys.settings.funWheel(),
    queryFn: async () => {
      const result = await settingsApi.getFunWheel();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

/**
 * Adds a reward.
 *
 * The response is the created row, so it's appended straight to the cached
 * list — the new reward appears immediately without a second round trip.
 * The list is still invalidated afterwards to pick up anything the server
 * filled in or reordered.
 */
export const useCreateRewardMutation = (): UseMutationResult<
  RewardMenuItem,
  Error,
  CreateRewardPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['settings', 'createReward'],
    mutationFn: async (payload: CreateRewardPayload) => {
      const result = await settingsApi.createReward(payload);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<RewardMenuItem[]>(
        queryKeys.settings.rewardMenu(),
        (current) => (current ? [...current, created] : [created]),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.settings.rewardMenu(),
      });
    },
    retry: false,
  });
};

/**
 * Adds an activity to the fun wheel.
 *
 * Refetches rather than patching the cache: the activity lives inside the
 * wheel object, and the create response shape isn't confirmed, so the server's
 * own view of the wheel is the only thing worth trusting.
 */
export const useCreateActivityMutation = (): UseMutationResult<
  null,
  Error,
  CreateActivityPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['settings', 'createActivity'],
    mutationFn: async (payload: CreateActivityPayload) => {
      const result = await settingsApi.createActivity(payload);
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.settings.funWheel(),
      });
    },
    retry: false,
  });
};
