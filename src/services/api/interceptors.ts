import {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_CONFIG, REGEX, SECURE_KEYS, TIMING } from '@constants';
import { secureStorage } from '@services/storage';
import type { AuthTokens, RefreshResponse } from '@app-types/api';
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

/**
 * Renew the access token.
 *
 * The server keeps the refresh credential in an httpOnly `myartist_art_rt`
 * cookie, so this call carries no body and reads nothing from storage — the
 * platform's cookie jar supplies it. A missing or expired cookie comes back
 * 401, which lands in the catch and ends the session.
 */
const performRefresh = async (): Promise<string | null> => {
  try {
    const response = await refreshClient.post<RefreshResponse>(
      ENDPOINTS.auth.refresh,
    );
    const tokens: AuthTokens = { accessToken: response.data.accessToken };

    await secureStorage.set(SECURE_KEYS.accessToken, tokens.accessToken);
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
      // Release builds refuse plaintext outright. Dev builds are allowed to
      // talk to a local API over http:// — see the matching guard in client.ts.
      const url = `${config.baseURL ?? API_CONFIG.baseUrl}${config.url ?? ''}`;
      if (!REGEX.httpsOnly.test(url) && !__DEV__) {
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
