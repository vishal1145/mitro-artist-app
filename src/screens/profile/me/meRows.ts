import { colors } from '@theme';

import type { Row } from './types';

export const ACCOUNT: Row[] = [
  {
    icon: 'user',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Profile',
    sub: 'Public details, rates & password',
    route: '/(app)/(tabs)/me/edit-profile',
  },
  {
    icon: 'users',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Followers',
    // Overridden at render with the real top-supporter count from useFollowers.
    sub: 'Top supporters',
    route: '/(app)/(tabs)/me/followers',
  },
  // Photos is hidden until the backend gives `/photos/upload-url` a unique
  // storage key per photo. Today it reuses one key per artist, so every
  // upload overwrites the last and the gallery shows the same picture on
  // every tile. The screen, its route and the whole data layer are intact —
  // restoring it is just putting this row back:
  //
  //   { icon: 'image', tint: colors.gold, fill: colors.goldSoft,
  //     title: 'Photos', sub: 'Your public gallery',
  //     route: '/(app)/(tabs)/me/photos' },
  {
    icon: 'settings',
    tint: colors.cyan,
    fill: colors.cyanSoft,
    title: 'Settings',
    sub: 'Reward menu & fun wheel',
    route: '/(app)/(tabs)/me/settings',
  },
  {
    icon: 'shield',
    tint: colors.gold,
    fill: colors.goldSoft,
    title: 'KYC & Payouts',
    sub: 'Required before withdrawal',
    route: '/(app)/(tabs)/me/kyc-payouts',
    // `pill` is set at render from the real kycStatus (REQUIRED/PENDING/…).
  },
];

export const ACTIVITY: Row[] = [
  {
    icon: 'inbox',
    tint: colors.green,
    fill: colors.successChip,
    title: 'Transaction History',
    sub: 'Every coin in and out',
    route: '/(app)/(tabs)/business/transactions',
  },
];
