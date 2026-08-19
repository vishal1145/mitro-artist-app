import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { attachInterceptors } from '@services/api';
import {
  connectAuthInterceptors,
  useAppStore,
  useAuthStore,
} from '@store';
import { colors } from '@theme';
import { logger } from '@utils/logger';

void SplashScreen.preventAutoHideAsync();

/**
 * Navigation theme. Without this React Navigation falls back to its light
 * default, which flashes white behind every push/pop transition.
 */
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
    notification: colors.error,
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Redirects between the (auth) and (app) groups based on auth + onboarding. */
const useAuthGuard = (): void => {
  const router = useRouter();
  const segments = useSegments();

  const authHydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const appHydrated = useAppStore((s) => s.hydrated);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  useEffect(() => {
    if (!authHydrated || !appHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace(hasOnboarded ? '/(auth)/login' : '/(auth)/onboarding');
    } else if (token && inAuthGroup) {
      router.replace('/(app)/(tabs)/home');
    }
  }, [authHydrated, appHydrated, token, hasOnboarded, segments, router]);
};

const RootLayout = () => {
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    // Plus Jakarta Sans is the whole type system now.
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  // Fonts are best-effort: if they fail we still render with system fonts.
  const fontsReady = fontsLoaded || Boolean(fontError);
  const appReady = ready && fontsReady;

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const bootstrap = async (): Promise<void> => {
      try {
        attachInterceptors();
        connectAuthInterceptors();
        await Promise.all([
          useAppStore.getState().bootstrap(),
          useAuthStore.getState().bootstrap(),
        ]);
      } catch (error) {
        logger.error('App bootstrap failed', { error: String(error) });
      } finally {
        setReady(true);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync();
    }
  }, [appReady]);

  useAuthGuard();

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" backgroundColor={colors.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: styles.stackContent,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="+not-found" options={{ animation: 'fade' }} />
            </Stack>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: colors.background,
  },
});

export default RootLayout;
