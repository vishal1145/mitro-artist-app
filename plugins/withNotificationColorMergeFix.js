const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * @react-native-firebase/messaging's own AndroidManifest.xml (bundled in its
 * AAR) declares these same meta-data keys with its own defaults
 * (default_notification_color = @color/white, and a default_notification_icon).
 * Gradle's manifest merger sees our app-level values (from the
 * expo-notifications plugin) conflict with the library's and fails
 * processReleaseMainManifest unless the app's entries carry
 * tools:replace="android:resource" — Expo's own plugins can't add this
 * automatically because the conflict only exists against a compiled library
 * manifest, invisible at prebuild time.
 *
 * We handle BOTH the color and icon keys, and — so this can't silently
 * no-op if expo-notifications ever changes when/how it injects the meta-data
 * — we CREATE the entry (pointing at the expo-notifications resources) when
 * it's missing rather than only patching an existing one.
 */
const META = [
  {
    name: 'com.google.firebase.messaging.default_notification_color',
    resource: '@color/notification_icon_color',
  },
  {
    name: 'com.google.firebase.messaging.default_notification_icon',
    resource: '@drawable/notification_icon',
  },
];

module.exports = function withNotificationColorMergeFix(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (!app) return config;

    app['meta-data'] = app['meta-data'] || [];

    for (const { name, resource } of META) {
      let entry = app['meta-data'].find((item) => item.$?.['android:name'] === name);
      if (!entry) {
        entry = { $: { 'android:name': name, 'android:resource': resource } };
        app['meta-data'].push(entry);
      }
      entry.$['tools:replace'] = 'android:resource';
    }

    return config;
  });
};
