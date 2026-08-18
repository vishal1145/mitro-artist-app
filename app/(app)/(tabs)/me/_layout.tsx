import { Stack } from 'expo-router';

import { tabStackOptions } from '@navigation/stackOptions';

/** Me tab stack: Profile -> Followers / Settings -> KycPayouts. */
const MeStackLayout = () => (
  <Stack screenOptions={tabStackOptions}>
    <Stack.Screen name="index" />
    <Stack.Screen name="followers" />
    <Stack.Screen name="messages" />
    <Stack.Screen name="settings" />
    <Stack.Screen name="kyc-payouts" />
  </Stack>
);

export default MeStackLayout;
