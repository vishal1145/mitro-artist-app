// Custom entry point (replaces the default `expo-router/entry` main).
//
// @react-native-firebase/messaging requires its background message handler
// to be registered at the top level, before the JS engine is allowed to
// sleep — which means before expo-router mounts anything. Registering it
// inside a component (or after the router import) is too late: Android may
// deliver a background/quit-state push before that code ever runs.
const { getApp } = require('@react-native-firebase/app');
const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');

setBackgroundMessageHandler(getMessaging(getApp()), async (remoteMessage) => {
  // The OS already renders the tray entry for messages with a `notification`
  // block. This handler exists to satisfy RNFirebase's registration
  // requirement and as a seam for background/data-only messages, if the API
  // ever sends any — there's nothing else to do with one today.
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[push] background message', remoteMessage.messageId);
  }
});

require('expo-router/entry');
