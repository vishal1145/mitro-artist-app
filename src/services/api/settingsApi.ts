import type {
  CreateActivityPayload,
  CreateRewardPayload,
  FunWheel,
  Result,
  RewardMenuItem,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Creator settings: the reward menu and the fun wheel.
 *
 * Only the reward menu can be written to so far — there's no confirmed
 * endpoint for toggling a reward, deleting one, or editing the wheel.
 */
export const settingsApi = {
  /** The artist's reward menu, active and inactive. Bare array. */
  async getRewardMenu(): Promise<Result<RewardMenuItem[]>> {
    try {
      const res = await api.get<RewardMenuItem[]>(ENDPOINTS.settings.rewardMenu);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Adds a reward. Responds with the created row, id and all. */
  async createReward(
    payload: CreateRewardPayload,
  ): Promise<Result<RewardMenuItem>> {
    try {
      const res = await api.post<RewardMenuItem>(
        ENDPOINTS.settings.rewardMenu,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** The single fun wheel, with its activities inline. */
  async getFunWheel(): Promise<Result<FunWheel>> {
    try {
      const res = await api.get<FunWheel>(ENDPOINTS.settings.funWheel);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Adds an activity to the wheel.
   *
   * Returns nothing useful to the caller — the response shape isn't confirmed,
   * so the wheel is refetched rather than patched into the cache from a body
   * we'd be guessing at.
   */
  async createActivity(payload: CreateActivityPayload): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.settings.funWheelActivities, payload);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
