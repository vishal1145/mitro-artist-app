import { Vibration } from 'react-native';

import { incomingCallNative } from '@services/push/incomingCallNative';

/**
 * Foreground ring for the in-app incoming private-call dialog - the RN
 * counterpart of the website's `incomingCallAlert.ts`. Looping ringtone
 * (native, system ringtone) + looping vibration. Needs android.permission.VIBRATE
 * (declared in the manifest by plugins/withIncomingCallNotification.js).
 * start/stop are idempotent.
 */
let ringing = false;

/** wait 0, buzz 800, pause 600 ... repeats until cancelled. */
const PATTERN = [0, 800, 600];

export const incomingCallAlert = {
  start(): void {
    if (ringing) return;
    ringing = true;
    incomingCallNative.startRingtone();
    Vibration.vibrate(PATTERN, true);
  },

  stop(): void {
    if (!ringing) return;
    ringing = false;
    incomingCallNative.stopRingtone();
    Vibration.cancel();
  },
};
