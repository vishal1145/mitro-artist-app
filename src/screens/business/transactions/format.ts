import type { LucideIconName } from '@components/ui';
import { webColors } from '@theme';

import type { TxBadge, TxFilter, TxIconType } from './types';

/* -------------------------------------------------------------------------- */
/* Row helpers — main.tsx 4512–4560                                            */
/* -------------------------------------------------------------------------- */

export const txIconType = (sourceType: string): TxIconType => {
  switch (sourceType) {
    case 'reaction':
      return 'reaction';
    case 'fun_wheel_spin':
      return 'wheel';
    case 'group_call_entry':
      return 'entry';
    case 'highlighted_message':
      return 'highlighted';
    default:
      return 'reward';
  }
};

/** `TX_ICON_BY_TYPE` — the exact lucide glyph the web puts in each tile. */
export const TX_ICON: Record<TxIconType, LucideIconName> = {
  reaction: 'heart',
  wheel: 'clock-3',
  entry: 'video',
  highlighted: 'star',
  reward: 'check',
};

/** `.tx-icon.<type>` tints. */
export const TX_TINT: Record<TxIconType, { bg: string; ink: string }> = {
  reaction: { bg: webColors.pinkChip, ink: webColors.pinkHot },
  wheel: { bg: webColors.cyanChip, ink: webColors.cyan },
  entry: { bg: webColors.purpleChip, ink: webColors.purple },
  highlighted: { bg: webColors.goldChip, ink: webColors.gold },
  reward: { bg: webColors.greenPill, ink: webColors.green },
};

/** `txBadgeClass` — "available" and "paid_out" both read as settled. */
export const txBadgeClass = (status: string): TxBadge => {
  if (status === 'pending') {
    return 'pending';
  }
  if (status === 'refunded' || status === 'reversed') {
    return 'refunded';
  }
  return 'settled';
};

export const FILTERS: readonly { key: TxFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'settled', label: 'Settled' },
  { key: 'refunded', label: 'Refunded' },
];

/** Rows fetched per request. */
export const PAGE_SIZE = 25;
