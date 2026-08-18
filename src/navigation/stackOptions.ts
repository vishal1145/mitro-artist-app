import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

import { colors } from '@theme';

type StackProps = ComponentProps<typeof Stack>;

/**
 * Shared screenOptions for every nested tab Stack. Keeps headers hidden
 * (screens render their own <Header />) and the background consistent.
 */
export const tabStackOptions: StackProps['screenOptions'] = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.background },
};
