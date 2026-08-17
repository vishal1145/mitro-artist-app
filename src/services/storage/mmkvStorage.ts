import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '@utils/logger';

/**
 * Non-sensitive persistent key-value storage.
 *
 * Backed by AsyncStorage so it runs in Expo Go with no native build. The
 * interface is ASYNC (every method returns a Promise). When we move to an EAS
 * dev build we can swap this implementation for react-native-mmkv behind the
 * exact same async signatures — callers won't need to change.
 *
 * NEVER store tokens or PII here — use secureStorage for those.
 */

export const mmkvStorage = {
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logger.warn('storage.getString failed', { key, error: String(error) });
      return null;
    }
  },

  async getBoolean(key: string): Promise<boolean> {
    return (await mmkvStorage.getString(key)) === 'true';
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await mmkvStorage.getString(key);
    if (raw == null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.warn('storage.getJSON parse failed', { key, error: String(error) });
      return null;
    }
  },

  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logger.warn('storage.setString failed', { key, error: String(error) });
    }
  },

  async setBoolean(key: string, value: boolean): Promise<void> {
    await mmkvStorage.setString(key, value ? 'true' : 'false');
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await mmkvStorage.setString(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.warn('storage.remove failed', { key, error: String(error) });
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      logger.warn('storage.clearAll failed', { error: String(error) });
    }
  },
};

/** Alias matching the minimal async interface (set/getString/delete/clearAll). */
export const storage = {
  set: (key: string, value: string): Promise<void> =>
    mmkvStorage.setString(key, value),
  getString: (key: string): Promise<string | null> => mmkvStorage.getString(key),
  delete: (key: string): Promise<void> => mmkvStorage.remove(key),
  clearAll: (): Promise<void> => mmkvStorage.clearAll(),
};

export type MmkvStorage = typeof mmkvStorage;
