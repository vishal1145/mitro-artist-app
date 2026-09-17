import { Redirect } from 'expo-router';

import { useAppStore, useAuthStore } from '@store';
import { Loader } from '@components/shared';

/**
 * Entry redirect. The root layout has already hydrated stores before this
 * renders; route to the correct group based on auth + onboarding state.
 */
const Index = () => {
  const authHydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const appHydrated = useAppStore((s) => s.hydrated);

  if (!authHydrated || !appHydrated) {
    return <Loader message="Starting Mitro Artist…" />;
  }

  if (token) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  // Onboarding/welcome screen skipped — go straight to login.
  return <Redirect href="/(auth)/login" />;
};

export default Index;
