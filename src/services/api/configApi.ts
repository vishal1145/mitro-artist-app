import type { ArtistRuntimeConfig, Result } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Runtime configuration served by the backend.
 *
 * The Agora App ID used to be a build-time constant on both clients. It now
 * lives in the backend's `app_setting` table and is served from here, so
 * rotating the Agora project no longer means shipping a new APK. The artist
 * web reads the same route (`agoraClientService.loadAppId`).
 */
export const configApi = {
  async getArtistConfig(): Promise<Result<ArtistRuntimeConfig>> {
    try {
      const res = await api.get<ArtistRuntimeConfig>(ENDPOINTS.config);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
