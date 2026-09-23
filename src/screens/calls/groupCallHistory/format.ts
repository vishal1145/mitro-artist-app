import { StyleSheet } from 'react-native';

import type { GroupCallAnalytics, GroupCallHistoryFilter, GroupCallHistoryItem } from '@app-types/api';
import { fontFamily, webColors } from '@theme';
import { grouped, webDateTime, webDuration } from '@utils/format';
import { rf } from '@utils/responsive';

/** `PAGE_SIZE` on the web's `GroupCallHistoryScreen`. */
export const PAGE_SIZE = 20;

/** `.filter-pills` — the web's three buttons, in its order. */
export const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ended', label: 'Ended' },
  { key: 'cancelled', label: 'Cancelled' },
] as const satisfies readonly { key: GroupCallHistoryFilter; label: string }[];

/** `.status-chip.{ended,cancelled,terminated}` fills. */
const chipStyles = StyleSheet.create({
  ended: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.neutralChip,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cancelled: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.redChip,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  terminated: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

/** The matching chip ink — `--premium-muted` / `#ff8a97` / `--premium-gold`. */
const chipInk = StyleSheet.create({
  ended: {
    color: webColors.muted,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  cancelled: {
    color: webColors.redInk,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  terminated: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
});

/** `statusChipClass()` — anything unrecognised falls back to the `ended` chip. */
export const statusChip = (status: string) => {
  if (status === 'cancelled' || status === 'failed') {
    return chipStyles.cancelled;
  }
  if (status === 'terminated') {
    return chipStyles.terminated;
  }
  return chipStyles.ended;
};

export const statusChipInk = (status: string) => {
  if (status === 'cancelled' || status === 'failed') {
    return chipInk.cancelled;
  }
  if (status === 'terminated') {
    return chipInk.terminated;
  }
  return chipInk.ended;
};

/** The row's meta line — start time and duration. */
export const groupCallMetaLine = (item: GroupCallHistoryItem): string =>
  `${item.startedAtUtc ? webDateTime(item.startedAtUtc) : 'never started'} · ${webDuration(item.durationSeconds)}`;

/** The `HelpIcon` hint next to each row's earnings figure. */
export const earningsHint = (item: GroupCallHistoryItem): string =>
  `You earned ${grouped(item.totalRevenueTokens)} coins for this call based on duration (${webDuration(item.durationSeconds)}) and peak participants (${grouped(item.peakParticipantCount)}).`;

export interface RevenueBreakdownRow {
  label: string;
  hint: string;
  amount: string;
  pct: number;
}

/**
 * The "Revenue breakdown" 3-row list under a call's analytics — previously
 * rebuilt inline on every expand-render. `pct` is zero-guarded against a call
 * with no revenue at all.
 */
export const revenueBreakdownRows = (analytics: GroupCallAnalytics): RevenueBreakdownRow[] => {
  const rows = [
    {
      label: 'Highlighted',
      value: analytics.highlightedMessageRevenueTokens,
      hint: 'Coins fans paid to highlight/pin their chat message during the call.',
    },
    {
      label: 'Rewards',
      value: analytics.rewardRevenueTokens,
      hint: 'Coins fans spent sending you rewards/gifts during the call.',
    },
    {
      label: 'Fun wheel',
      value: analytics.funWheelRevenueTokens,
      hint: 'Coins fans spent spinning the Fun Wheel during the call.',
    },
  ] as const;

  return rows.map((row) => ({
    label: row.label,
    hint: row.hint,
    amount: `${grouped(row.value)} coins`,
    pct: analytics.totalRevenueTokens > 0 ? (row.value / analytics.totalRevenueTokens) * 100 : 0,
  }));
};
