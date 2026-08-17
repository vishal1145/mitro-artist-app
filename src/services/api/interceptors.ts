import {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_CONFIG, REGEX, SECURE_KEYS, TIMING } from '@constants';
import { secureStorage } from '@services/storage';
import type { ApiResponse, AuthTokens, RefreshTokenPayload } from '@types/api';
import { logger } from '@utils/logger';

import { api, refreshClient } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Interceptors:
 *  - Attach Bearer token to every request.
 *  - Enforce HTTPS.
 *  - On 401: silently refresh the token once, retry, else trigger logout.
 *
 * A callback bridge decouples this module from the auth store, so there's no
 * circular import: the store registers a handler on startup.
 */

type AuthFailureHandler = () => void | Promise<void>;
type TokensRefreshedHandler = (tokens: AuthTokens) => void;

let onAuthFailure: AuthFailureHandler | null = null;
let onTokensRefreshed: TokensRefreshedHandler | null = null;

export const registerAuthHandlers = (handlers: {
  onAuthFailure: AuthFailureHandler;
  onTokensRefreshed: TokensRefreshedHandler;
}): void => {
  onAuthFailure = handlers.onAuthFailure;
  onTokensRefreshed = handlers.onTokensRefreshed;
};

// --- Single-flight refresh coordination ---
let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  const refreshToken = await secureStorage.get(SECURE_KEYS.refreshToken);
  if (!refreshToken) {
    return null;
  }

  try {
    const payload: RefreshTokenPayload = { refreshToken };
    const response = await refreshClient.post<ApiResponse<AuthTokens>>(
      ENDPOINTS.auth.refresh,
      payload,
    );
    const tokens = response.data.data;

    await secureStorage.set(SECURE_KEYS.accessToken, tokens.accessToken);
    await secureStorage.set(SECURE_KEYS.refreshToken, tokens.refreshToken);
    onTokensRefreshed?.(tokens);

    return tokens.accessToken;
  } catch (error) {
    logger.warn('Token refresh failed', { error: String(error) });
    return null;
  }
};

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

export const attachInterceptors = (): void => {
  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const url = `${config.baseURL ?? API_CONFIG.baseUrl}${config.url ?? ''}`;
      if (!REGEX.httpsOnly.test(url)) {
        return Promise.reject(
          new Error('Blocked non-HTTPS request. HTTPS is required.'),
        );
      }

      const token = await secureStorage.get(SECURE_KEYS.accessToken);
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;

      const isRefreshCall = original?.url === ENDPOINTS.auth.refresh;
      const retryCount = original?._retryCount ?? 0;

      if (
        status === 401 &&
        original &&
        !isRefreshCall &&
        retryCount < TIMING.tokenRefreshRetries
      ) {
        original._retryCount = retryCount + 1;

        refreshPromise = refreshPromise ?? performRefresh();
        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          original.headers.set('Authorization', `Bearer ${newToken}`);
          return api(original);
        }

        await onAuthFailure?.();
      }

      return Promise.reject(error);
    },
  );
};
