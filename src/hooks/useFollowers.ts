import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { followersApi } from '@services/api';
import type { FollowersResponse } from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/** Followers list + engagement summary (top supporters, session regulars, new this week). */
export const useFollowers = (): UseQueryResult<FollowersResponse, Error> =>
  useQuery({
    queryKey: queryKeys.followers.list(),
    queryFn: async () => {
      const result = await followersApi.getFollowers();
      if (!result.success) {
        throw new AuthError(result.error);
      }
      return result.data;
    },
    staleTime: 60_000,
    retry: false,
  });
