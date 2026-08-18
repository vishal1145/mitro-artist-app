import Constants from 'expo-constants';

/** App-wide constants. No magic numbers or strings should live in components. */

interface AppExtra {
  apiBaseUrl?: string;
  apiTimeoutMs?: number;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

export const APP = {
  name: 'Mitro Artist',
  scheme: 'mitroartist',
} as const;

export const API_CONFIG = {
  baseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.apiBaseUrl ??
    'https://api.mitro.app',
  timeoutMs: Number(
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? extra.apiTimeoutMs ?? 20000,
  ),
} as const;

/** Keys used with the secure (encrypted) store. Tokens ONLY. */
export const SECURE_KEYS = {
  accessToken: 'mitro.auth.accessToken',
  refreshToken: 'mitro.auth.refreshToken',
} as const;

/** Keys used with MMKV (non-sensitive persistent data). */
export const STORAGE_KEYS = {
  hasOnboarded: 'mitro.app.hasOnboarded',
  themePreference: 'mitro.app.themePreference',
  lastEmail: 'mitro.app.lastEmail',
} as const;

/**
 * Hardcoded demo login. Temporary bypass until the real auth API is wired:
 * entering these exact credentials on the login screen jumps straight to the
 * dashboard. Remove this (and the bypass in useLogin) once the API is live.
 */
export const DEMO_AUTH = {
  identifier: 'artist123',
  password: 'golive123',
} as const;

/** Timing / behavior constants. */
export const TIMING = {
  searchDebounceMs: 400,
  otpResendCooldownSec: 60,
  otpMaxAttempts: 3,
  tokenRefreshRetries: 1,
} as const;

export const REGEX = {
  httpsOnly: /^https:\/\//i,
} as const;
