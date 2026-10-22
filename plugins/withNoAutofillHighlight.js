// Android paints a yellow "autofilled" highlight over any EditText that the
// password manager fills (the login / signup fields ask for username/password
// autofill). Make that highlight transparent so filled fields keep the app's
// dark input style - autofill itself keeps working.
const { withAndroidStyles, AndroidConfig } = require('expo/config-plugins');

module.exports = function withNoAutofillHighlight(config) {
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' },
      name: 'android:autofilledHighlight',
      value: '@android:color/transparent',
    });
    return cfg;
  });
};
