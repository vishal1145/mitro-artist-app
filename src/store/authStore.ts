import { create } from 'zustand';

import { SECURE_KEYS } from '@constants';
import { authApi, registerAuthHandlers } from '@services/api';
import { queryClient } from '@services/queryClient';
import { secureStorage } from '@services/storage';
import type { AuthSession, AuthTokens, User } from '@app-types/api';
import { logger } from '@utils/logger';

/**
 * Auth state (Zustand). Tokens are the source of truth in expo-secure-store
 * (encrypted); the store mirrors the access token + user in memory so the
 * navigation guard can react synchronously.
 */

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  hydrated: boolean;
  token: string | null;
  user: User | null;

  bootstrap: () => Promise<void>;
  authenticate: (session: AuthSession) => Promise<void>;
  updateTokens: (tokens: AuthTokens) => void;
  logout: () => Promise<void>;
}

const persistSession = async (session: AuthSession): Promise<void> => {
  await secureStorage.set(SECURE_KEYS.accessToken, session.tokens.accessToken);
  // The artist API issues an access token only. Clear any stale refresh token
  // rather than writing `undefined`, so the interceptor doesn't try to renew
  // with a token from a previous session.
  if (session.tokens.refreshToken) {
    await secureStorage.set(SECURE_KEYS.refreshToken, session.tokens.refreshToken);
  } else {
    await secureStorage.remove(SECURE_KEYS.refreshToken);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  hydrated: false,
  token: null,
  user: null,

  bootstrap: async () => {
    try {
      const token = await secureStorage.get(SECURE_KEYS.accessToken);
      set({
        token,
        status: token ? 'authenticated' : 'unauthenticated',
        hydrated: true,
      });
    } catch (error) {
      logger.error('Auth bootstrap failed', { error: String(error) });
      set({ token: null, status: 'unauthenticated', hydrated: true });
    }
  },

  authenticate: async (session) => {
    await persistSession(session);
    // Drop anything cached for a previous account before the new one's screens
    // mount, so a fresh login never renders the last user's data.
    queryClient.clear();
    set({
      token: session.tokens.accessToken,
      user: session.user,
      status: 'authenticated',
    });
  },

  updateTokens: (tokens) => {
    set({ token: tokens.accessToken });
  },

  logout: async () => {
    // Best-effort server logout; local cleanup happens regardless, even if the
    // network call fails.
    try {
      await authApi.logout();
    } catch (error) {
      logger.warn('Server logout failed; clearing local session anyway', {
        error: String(error),
      });
    }
    await secureStorage.removeMany([
      SECURE_KEYS.accessToken,
      SECURE_KEYS.refreshToken,
    ]);
    // Wipe every cached query so the next account can't see this user's
    // profile, earnings, or transactions. Without this the stale cache shows
    // until something happens to refetch it (e.g. changing the avatar).
    queryClient.clear();
    set({ token: null, user: null, status: 'unauthenticated' });
  },
}));

/**
 * Wire the API interceptors to the store without a circular import.
 * Call once at app startup (see app/_layout.tsx).
 */
export const connectAuthInterceptors = (): void => {
  registerAuthHandlers({
    onAuthFailure: () => {
      void useAuthStore.getState().logout();
    },
    onTokensRefreshed: (tokens) => {
      useAuthStore.getState().updateTokens(tokens);
    },
  });
};
