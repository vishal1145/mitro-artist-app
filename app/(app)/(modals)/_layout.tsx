import { Stack } from 'expo-router';

import { colors } from '@theme';

/**
 * Modal group — presented over the tabs with the tab bar hidden.
 * Call/broadcast rooms are fullscreen and immersive.
 */
const ModalsLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      presentation: 'fullScreenModal',
      animation: 'slide_from_bottom',
      gestureEnabled: false,
      contentStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="live-broadcast-room" />
    <Stack.Screen name="broadcast-summary" />
    <Stack.Screen name="group-call-room" />
    <Stack.Screen name="private-call-room" />
    <Stack.Screen name="incoming-call-request" />
    <Stack.Screen name="chat-thread" options={{ presentation: 'modal', gestureEnabled: true }} />
    <Stack.Screen name="verify-number" options={{ presentation: 'modal', gestureEnabled: true }} />
    <Stack.Screen name="change-password" options={{ presentation: 'modal', gestureEnabled: true }} />
  </Stack>
);

export default ModalsLayout;
