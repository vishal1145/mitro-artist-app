import { Stack } from 'expo-router';

import { tabStackOptions } from '@navigation/stackOptions';

/** Calls tab stack: CallsHub -> ScheduleSession / PrivateCalls / GroupCallHistory / BroadcastHistory. */
const CallsStackLayout = () => (
  <Stack screenOptions={tabStackOptions}>
    <Stack.Screen name="index" />
    <Stack.Screen name="schedule-session" />
    <Stack.Screen name="private-calls" />
    <Stack.Screen name="group-call-history" />
    <Stack.Screen name="broadcast-history" />
  </Stack>
);

export default CallsStackLayout;
