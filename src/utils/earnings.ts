import type { Feather } from '@expo/vector-icons';

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

/**
 * `EARNING_SOURCE_LABELS` from the Artist Web's `src/services/earningsService.ts`
 * (lines 47–54), used verbatim by the Transaction History replica so its rows
 * read exactly as the web's do.
 *
 * Deliberately separate from `sourceLabel` above: that one is tuned for the
 * narrow Earnings breakdown rows ("Private / min", "Highlighted msg") and is
 * shared with other screens, so it is left untouched.
 */
const WEB_SOURCE_LABELS: Record<string, string> = {
  highlighted_message: 'Highlighted Messages',
  reaction: 'Reactions',
  reward_purchase: 'Rewards',
  fun_wheel_spin: 'Fun Wheel',
  group_call_entry: 'Group Call Entry',
  private_call_initial_5_minutes: 'Private Call (First 5 Minutes)',
};

/** The web's `earningSourceLabel()`, including its `prettifySourceType` fallback. */
export const webSourceLabel = (sourceType: string): string =>
  WEB_SOURCE_LABELS[sourceType] ??
  sourceType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * `EARNING_SOURCE_HINTS` from the web's `earningsService.ts` (lines 56–63),
 * shown when the artist taps the "?" next to a source in the Earnings
 * breakdown — the mobile stand-in for the web's hover tooltip.
 */
const WEB_SOURCE_HINTS: Record<string, string> = {
  highlighted_message:
    'Coins fans paid to highlight/pin their chat message during one of your broadcasts or calls.',
  reaction: 'Coins fans spent sending paid reactions during your streams.',
  reward_purchase: 'Coins fans spent sending you rewards or gifts.',
  fun_wheel_spin: 'Coins fans spent spinning the Fun Wheel during your streams.',
  group_call_entry: 'Coins fans paid to join your group calls.',
  private_call_initial_5_minutes:
    'Coins fans paid for the first 5 minutes of a private 1:1 call with you.',
};

/** The web's `earningSourceHint()`, with the same neutral fallback. */
export const webSourceHint = (sourceType: string): string =>
  WEB_SOURCE_HINTS[sourceType] ?? 'Coins earned from this activity.';
