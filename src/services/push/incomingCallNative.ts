import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, NativeModules, Platform } from 'react-native';

import { logger } from '@utils/logger';

/**
 * JS face of the native incoming-call ringer (plugins/incoming-call/*.kt,
 * exposed as NativeModules.IncomingCall). Android only - every call is a safe
 * no-op elsewhere or when the native module isn't in the build (e.g. Expo Go).
 */
interface IncomingCallNative {
  canUseFullScreenIntent: () => Promise<boolean>;
  openFullScreenIntentSettings: () => void;
  cancel: (requestId: string) => void;
  cancelAll: () => void;
}

const native: IncomingCallNative | null =
  Platform.OS === 'android' ? (NativeModules.IncomingCall as IncomingCallNative | undefined) ?? null : null;

const FSI_PROMPTED_AT = 'mitro.incomingCall.fsiPromptedAt';
const FSI_PROMPT_EVERY_MS = 24 * 60 * 60 * 1000;

export const incomingCallNative = {
  /** Stop the native ring for one request (handled / cancelled). */
  cancel(requestId: string): void {
    native?.cancel(requestId);
  },

  /** Stop every native ring - the app is foreground, the in-app overlay owns it now. */
  cancelAll(): void {
    native?.cancelAll();
  },

  /**
   * Android 14+ can revoke "full-screen intents"; without it the call can't
   * light up a locked screen (it degrades to a heads-up notification). Asks the
   * artist to grant it, at most once a day, and deep-links to the right page.
   */
  async ensureFullScreenIntentAccess(): Promise<void> {
    if (!native) return;
    try {
      if (await native.canUseFullScreenIntent()) return;

      const last = Number(await AsyncStorage.getItem(FSI_PROMPTED_AT)) || 0;
      if (Date.now() - last < FSI_PROMPT_EVERY_MS) return;
      await AsyncStorage.setItem(FSI_PROMPTED_AT, String(Date.now()));

      Alert.alert(
        'Show calls on your lock screen',
        'Allow "Full screen notifications" for Mitro Artist so private call requests can ring on your lock screen like a real call.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => native.openFullScreenIntentSettings() },
        ],
      );
    } catch (error) {
      logger.warn('Full-screen intent check failed', { error: String(error) });
    }
  },
};
