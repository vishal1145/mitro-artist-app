import { Stack } from 'expo-router';

import { colors } from '@theme';

/** Unauthenticated stack. */
const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.content,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp-verify" />
    </Stack>
  );
};

const styles = {
  content: { backgroundColor: colors.background },
} as const;

export default AuthLayout;
