import { Stack } from 'expo-router';

import { tabStackOptions } from '@navigation/stackOptions';

/** Live tab stack: GoLiveSetup (the broadcast room itself is a modal). */
const LiveStackLayout = () => (
  <Stack screenOptions={tabStackOptions}>
    <Stack.Screen name="index" />
  </Stack>
);

export default LiveStackLayout;
