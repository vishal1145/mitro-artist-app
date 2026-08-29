const { withAndroidManifest } = require('@expo/config-plugins');

const META_DATA_NAME = 'com.google.firebase.messaging.default_notification_color';

/**
 * @react-native-firebase/messaging's own AndroidManifest.xml (bundled in
 * its AAR) declares this same meta-data key with its own default
 * (@color/white). Gradle's manifest merger sees our app-level value
 * (@color/notification_icon_color, from the expo-notifications plugin)
 * conflict with the library's and fails processReleaseMainManifest unless
 * the app's entry says tools:replace="android:resource" - Expo's own
 * plugins can't add this automatically because the conflict only exists
 * against a compiled library manifest, invisible at prebuild time.
 */
module.exports = function withNotificationColorMergeFix(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    const metaDataList = app?.['meta-data'];
    if (!metaDataList) return config;

    const entry = metaDataList.find(
      (item) => item.$?.['android:name'] === META_DATA_NAME
    );
    if (entry) {
      entry.$['tools:replace'] = 'android:resource';
    }

    return config;
  });
};
