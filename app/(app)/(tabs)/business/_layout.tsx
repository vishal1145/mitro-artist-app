import { Stack } from 'expo-router';

import { tabStackOptions } from '@navigation/stackOptions';

/** Business tab stack: Earnings -> Transactions / Withdraw. */
const BusinessStackLayout = () => (
  <Stack screenOptions={tabStackOptions}>
    <Stack.Screen name="index" />
    <Stack.Screen name="transactions" />
    <Stack.Screen name="withdraw" />
  </Stack>
);

export default BusinessStackLayout;
