/**
 * Custom render wrapping EXACTLY the providers the real app root
 * (`app/_layout.tsx`) mounts around every screen:
 *
 *   GestureHandlerRootView > SafeAreaProvider > ThemeProvider > QueryClientProvider
 *
 * `app/_layout.tsx` additionally does font loading, the auth-redirect guard,
 * push/agora bootstrap, and renders `NotificationToastHost` +
 * `IncomingCallOverlay` above the stack — those are exercised by
 * `app/_layout.test.tsx` directly, not by every screen test, so they are
 * deliberately NOT part of this wrapper. If a screen assumes one of those is
 * mounted above it (e.g. reads toast state), say so in that screen's test
 * file rather than growing this wrapper for one case.
 *
 * A fresh `QueryClient` is created per render so react-query cache never
 * leaks between tests; pass your own via `queryClient` to pre-seed it.
 */
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

const TEST_SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

interface WrapperOptions {
  queryClient?: QueryClient;
}

const AllProviders =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <ThemeProvider value={DarkTheme}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

/**
 * Render a screen/component under the app's real provider stack.
 *
 * expo-router's `useRouter`/`useLocalSearchParams`/`useFocusEffect` are
 * globally mocked in jest.setup.ts (`mockRouter` is exported from there) —
 * this helper does not re-mock navigation, it only supplies the
 * non-router providers a screen actually reads from context.
 */
export function renderScreen(
  ui: ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;
  return {
    queryClient,
    ...render(ui, { wrapper: AllProviders(queryClient), ...renderOptions }),
  };
}

export * from '@testing-library/react-native';
