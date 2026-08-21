import Constants from 'expo-constants';

/**
 * Mock switch.
 *
 * While the backend is being wired, every API module can resolve from a local
 * fixture instead of the network. Screens stay identical either way — they
 * consume the same typed hooks, so flipping this flag is the only change
 * needed to move a screen from fixture data to live data.
 *
 * Set `extra.useMock` to `false` in app.json (or define EXPO_PUBLIC_USE_MOCK)
 * once the endpoints are live.
 */
const extra = Constants.expoConfig?.extra as { useMock?: boolean } | undefined;

export const USE_MOCK: boolean =
  process.env.EXPO_PUBLIC_USE_MOCK === 'false'
    ? false
    : process.env.EXPO_PUBLIC_USE_MOCK === 'true'
      ? true
      : (extra?.useMock ?? true);

/** Fake latency so loading states and skeletons are actually exercised. */
const MOCK_DELAY_MS = 450;

/**
 * Resolve a fixture after a short delay.
 *
 * Use in an api module as the `USE_MOCK` branch:
 *
 *   if (USE_MOCK) return mocked(FIXTURE);
 *   const { data } = await api.get(ENDPOINTS.x.y);
 *   return data;
 */
export const mocked = <T>(value: T, delayMs = MOCK_DELAY_MS): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), delayMs);
  });

/** Reject after the same delay — for exercising error states by hand. */
export const mockedError = (message = 'Mock failure', delayMs = MOCK_DELAY_MS): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delayMs);
  });
