import { Feather } from '@expo/vector-icons';

import { titleCase } from './format';

type FeatherIconName = keyof typeof Feather.glyphMap;

/**
 * Presentation metadata for the server's `sourceType` codes — one place so the
 * Earnings breakdown and the Transactions ledger label the same code
 * identically. Anything not listed falls back to a prettified label and a
 * neutral icon, so a new earning type still reads sensibly.
 */
interface SourceMeta {
  label: string;
  icon: FeatherIconName;
}

const SOURCE_META: Record<string, SourceMeta> = {
  private_call_minute: { label: 'Private / min', icon: 'phone' },
  private_call_initial_5_minutes: { label: 'Private (first 5 min)', icon: 'phone-call' },
  fun_wheel_spin: { label: 'Fun wheel', icon: 'shuffle' },
  reward_purchase: { label: 'Rewards', icon: 'gift' },
  highlighted_message: { label: 'Highlighted msg', icon: 'message-circle' },
  reaction: { label: 'Reactions', icon: 'heart' },
  group_call_entry: { label: 'Group entry', icon: 'users' },
};

/** Friendly label for a source code, e.g. "fun_wheel_spin" → "Fun wheel". */
export const sourceLabel = (sourceType: string): string =>
  SOURCE_META[sourceType]?.label ?? titleCase(sourceType.replace(/_/g, ' '));

/** Feather icon standing in for a source code. */
export const sourceIcon = (sourceType: string): FeatherIconName =>
  SOURCE_META[sourceType]?.icon ?? 'zap';
