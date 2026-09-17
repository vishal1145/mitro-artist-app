import axios from 'axios';

import type {
  CreateActivityPayload,
  CreateRewardPayload,
  FunWheel,
  Result,
  RewardMenuItem,
  UpdateActivityPayload,
  UpdateFunWheelPayload,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/** `deleteFunWheel`'s result — a plain `Result<null>` plus the 409 flag. */
export type DeleteWheelResult =
  | { success: true; data: null }
  | { success: false; error: string; conflict?: boolean };

/**
 * Creator settings: the reward menu and the fun wheel.
 *
 * Mirrors the web's `artistSettingsService` — reads plus the full set of
 * writes for both the menu and the wheel.
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

  /**
   * The artist's fun wheel, or `null` when they haven't made one.
   *
   * "No wheel" does NOT come back as a 404 — the server answers **200** with
   * `{ "message": "Fun wheel not found." }`. That body is truthy, so every
   * `if (!wheel)` guard upstream sailed straight past it and the Settings
   * screen died on `wheel.activities.length` the moment a new artist opened
   * it. Collapsing it to `null` here is what makes those guards mean what
   * they say, so the shape is decided once instead of at each call site.
   */
  async getFunWheel(): Promise<Result<FunWheel | null>> {
    try {
      const res = await api.get<FunWheel | { message?: string }>(
        ENDPOINTS.settings.funWheel,
      );
      const body = res.data;
      const wheel =
        body && typeof body === 'object' && 'id' in body ? (body as FunWheel) : null;
      return { success: true, data: wheel };
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

  /* ----------------------- Fun wheel — writes --------------------------- */
  /* Same four calls the web's `artistSettingsService` makes. Without these the
     wheel was read-only in the app: the name, the price, the on/off switch and
     Delete all moved the UI and sent nothing. */

  /** Rename the wheel / change its price per spin. */
  async updateFunWheel(
    wheelId: string,
    payload: UpdateFunWheelPayload,
  ): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.settings.funWheelById(wheelId), payload);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** The wheel's on/off switch. PATCH, like the web. */
  async setFunWheelActive(
    wheelId: string,
    isActive: boolean,
  ): Promise<Result<null>> {
    try {
      await api.patch(ENDPOINTS.settings.funWheelStatus(wheelId), { isActive });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * A wheel that already has spin history can't be hard-deleted — the server
   * answers 409 with its own message. That is an expected state, not an error
   * toast: the web (`main.tsx` 8326–8336) surfaces it in a "Can't Delete This
   * Wheel" dialog offering "Turn Off Instead", so the 409 is flagged here as
   * `conflict` for the screen to branch on.
   */
  async deleteFunWheel(wheelId: string): Promise<DeleteWheelResult> {
    try {
      await api.delete(ENDPOINTS.settings.funWheelById(wheelId));
      return { success: true, data: null };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const message = (error.response.data as { message?: string } | undefined)?.message;
        return {
          success: false,
          conflict: true,
          error: message || "This fun wheel has spin history and can't be deleted.",
        };
      }
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Rename one activity. `weight` omitted leaves the existing value alone. */
  async updateActivity(
    activityId: string,
    payload: UpdateActivityPayload,
  ): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.settings.funWheelActivity(activityId), payload);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /* --------------------- Reward menu — writes --------------------------- */

  /** The reward row's on/off switch. PATCH, like the web. */
  async setRewardActive(id: string, isActive: boolean): Promise<Result<null>> {
    try {
      await api.patch(ENDPOINTS.settings.rewardStatus(id), { isActive });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async updateReward(
    id: string,
    payload: CreateRewardPayload,
  ): Promise<Result<null>> {
    try {
      await api.put(ENDPOINTS.settings.reward(id), payload);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
