import { QueryClient } from '@tanstack/react-query';

/**
 * The app's single QueryClient.
 *
 * Kept in its own module (rather than inline in the root layout) so non-React
 * code — the auth store in particular — can reach the same instance. That lets
 * logout wipe every cached query, so the next user who signs in never sees the
 * previous account's profile, earnings, or transactions bleed through.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
