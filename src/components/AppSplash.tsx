import { useCallback } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { colors, spacing } from '@theme';

/**
 * Branded splash shown while the app bootstraps (auth + stores hydrate,
 * fonts load). Mirrors the user app's SplashScreen exactly — logo centred on
 * the app background with a spinner underneath — so the launch experience is
 * identical across both apps. Matches the native splash background (see
 * app.json) so the hand-off from native splash to this JS screen has no
 * visual jump: `hideAsync()` fires on first layout.
 */
export function AppSplash() {
  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Image
        source={require('../static/images/splash-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator color={colors.purple} size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginTop: spacing.sm,
  },
});
