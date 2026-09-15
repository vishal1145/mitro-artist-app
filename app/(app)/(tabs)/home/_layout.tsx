import { Stack } from 'expo-router';

import { tabStackOptions } from '@navigation/stackOptions';

/** Home tab stack: Dashboard -> Notifications / Search / BroadcastDetail. */
const HomeStackLayout = () => (
  <Stack screenOptions={tabStackOptions}>
    <Stack.Screen name="index" />
    <Stack.Screen name="notifications" />
    <Stack.Screen name="search" />
    <Stack.Screen name="broadcast-detail" />
  </Stack>
);

export default HomeStackLayout;
