import { Redirect, Stack } from 'expo-router';

import { Loader } from '@components/shared';
import { useAuthStore } from '@store';
import { colors } from '@theme';

/**
 * Authenticated area wrapper. Guards the whole group: unauthenticated users
 * are bounced to login before any tab renders.
 */
const AppLayout = () => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  if (!hydrated) {
    return <Loader message="Loading…" />;
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.content,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modals)" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
};

const styles = {
  content: { backgroundColor: colors.background },
} as const;

export default AppLayout;
