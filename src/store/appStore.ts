import { create } from 'zustand';

import { STORAGE_KEYS } from '@constants';
import { mmkvStorage } from '@services/storage';

/**
 * App-level UI/preference state. Persisted (non-sensitive) values are backed
 * by AsyncStorage (Expo Go friendly); the first-launch onboarding flag lives
 * here. The storage interface is async, so these actions are async too.
 */

interface AppState {
  hasOnboarded: boolean;
  hydrated: boolean;

  bootstrap: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  hasOnboarded: false,
  hydrated: false,

  bootstrap: async () => {
    const hasOnboarded = await mmkvStorage.getBoolean(STORAGE_KEYS.hasOnboarded);
    set({ hasOnboarded, hydrated: true });
  },

  completeOnboarding: async () => {
    // Update state first so the UI/guard react immediately, then persist.
    set({ hasOnboarded: true });
    await mmkvStorage.setBoolean(STORAGE_KEYS.hasOnboarded, true);
  },

  resetOnboarding: async () => {
    set({ hasOnboarded: false });
    await mmkvStorage.setBoolean(STORAGE_KEYS.hasOnboarded, false);
  },
}));
