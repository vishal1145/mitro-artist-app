import * as SecureStore from 'expo-secure-store';

import { logger } from '@utils/logger';

/**
 * Encrypted storage wrapper (expo-secure-store).
 * Use this ONLY for sensitive values — access & refresh tokens.
 * Never store tokens in MMKV or AsyncStorage.
 */

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, OPTIONS);
    } catch (error) {
      logger.error('secureStorage.set failed', { key, error: String(error) });
      throw error;
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, OPTIONS);
    } catch (error) {
      logger.error('secureStorage.get failed', { key, error: String(error) });
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, OPTIONS);
    } catch (error) {
      logger.error('secureStorage.remove failed', { key, error: String(error) });
    }
  },

  /** Remove several keys in parallel; used on logout. */
  async removeMany(keys: readonly string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.remove(key)));
  },
};

export type SecureStorage = typeof secureStorage;
