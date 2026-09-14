import type { FollowersResponse, Result } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/** Read-only followers list: engagement summary + one row per follower. */
export const followersApi = {
  async getFollowers(): Promise<Result<FollowersResponse>> {
    try {
      const res = await api.get<FollowersResponse>(ENDPOINTS.followers.list);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
