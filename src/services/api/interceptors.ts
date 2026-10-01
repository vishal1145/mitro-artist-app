import {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';

import { ALLOW_INSECURE_HTTP, API_CONFIG, REGEX, SECURE_KEYS, TIMING } from '@constants';
import { secureStorage } from '@services/storage';
import type { AuthTokens, RefreshResponse } from '@app-types/api';
import { AuthError } from '@utils/errorHandler';
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

// --- Per-platform login sessions (max 1 web + 1 android per artist) ---
// The backend needs to know which slot this client occupies and which
// install it is, on every request (login, refresh, logout, everything):
// X-Client-Platform ("android" for the native app) and X-Device-Id, a UUID
// generated once per install and kept in secure storage, so the same phone
// logging in again replaces its own session instead of being blocked as
// "another phone".
const CLIENT_PLATFORM = Platform.OS === 'web' ? 'web' : 'android';
let cachedDeviceId: string | null = null;

const generateDeviceId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await secureStorage.get(SECURE_KEYS.deviceId);
  if (!id) {
    id = generateDeviceId();
    try {
      await secureStorage.set(SECURE_KEYS.deviceId, id);
    } catch {
      // keep the in-memory id for this process; a new one is made next launch
    }
  }
  cachedDeviceId = id;
  return id;
};

const attachClientSessionHeaders = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    config.headers.set('X-Client-Platform', CLIENT_PLATFORM);
    config.headers.set('X-Device-Id', await getDeviceId());
    return config;
  });
};

// 401 bodies with one of these codes mean the login session itself is gone
// (replaced by a newer login from this device / expired / revoked by logout
// or password reset). There is nothing to refresh - the refresh token was
// revoked with it - so go straight to logout.
const SESSION_ENDED_CODES = new Set(['SESSION_INVALIDATED', 'SESSION_EXPIRED', 'SESSION_REVOKED']);

const isSessionEnded = (data: unknown): boolean => {
  if (typeof data !== 'object' || data === null || !('code' in data)) return false;
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' && SESSION_ENDED_CODES.has(code);
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
  attachClientSessionHeaders(api);
  attachClientSessionHeaders(refreshClient);

  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Release builds refuse plaintext outright. Dev builds are allowed to
      // talk to a local API over http:// — see the matching guard in client.ts.
      const url = `${config.baseURL ?? API_CONFIG.baseUrl}${config.url ?? ''}`;
      if (!REGEX.httpsOnly.test(url) && !__DEV__ && !ALLOW_INSECURE_HTTP) {
        // AuthError, not Error: its message passes through normalizeError
        // untouched. A plain Error here became "Something went wrong. Please
        // try again." on every screen of a release build — which hid the fact
        // that the app was configured with a plaintext API URL and never made
        // a single request.
        return Promise.reject(
          new AuthError(
            'This build can only connect over HTTPS. Rebuild with an https:// API URL.',
          ),
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

      if (status === 401 && original && !isRefreshCall && isSessionEnded(error.response?.data)) {
        // Session ended server-side: no refresh attempt, straight to login.
        await onAuthFailure?.();
        return Promise.reject(error);
      }

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
