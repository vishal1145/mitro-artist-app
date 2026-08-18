import { Stack } from 'expo-router';

import { tabStackOptions } from '@navigation/stackOptions';

/** Home tab stack: Dashboard -> Notifications / Search / BroadcastDetail / RewardFulfillment. */
const HomeStackLayout = () => (
  <Stack screenOptions={tabStackOptions}>
    <Stack.Screen name="index" />
    <Stack.Screen name="notifications" />
    <Stack.Screen name="search" />
    <Stack.Screen name="broadcast-detail" />
    <Stack.Screen name="reward-fulfillment" />
  </Stack>
);

export default HomeStackLayout;
