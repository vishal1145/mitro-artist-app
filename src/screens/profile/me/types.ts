import { Feather } from '@expo/vector-icons';

import type { ColorToken } from '@theme';

export type FeatherIconName = keyof typeof Feather.glyphMap;

export type Href =
  | '/(app)/(tabs)/me/edit-profile'
  | '/(app)/(tabs)/me/messages'
  | '/(app)/(tabs)/me/followers'
  | '/(app)/(tabs)/me/photos'
  | '/(app)/(tabs)/me/settings'
  | '/(app)/(tabs)/me/kyc-payouts'
  | '/(app)/(tabs)/business/transactions';

export interface Row {
  icon: FeatherIconName;
  tint: string;
  fill: string;
  title: string;
  sub: string;
  route: Href;
  /** Pink count bubble. */
  badge?: number;
  /** Gold status pill, e.g. REQUIRED. */
  pill?: string;
}

export interface Stat {
  value: string;
  label: string;
  color: ColorToken;
}
