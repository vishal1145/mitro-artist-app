import type { LucideIconName } from '@components/ui';
import type { BroadcastAnalytics, BroadcastHistoryItem } from '@app-types/api';
import { webColors } from '@theme';
import { grouped, webDateTime, webDuration } from '@utils/format';

/** `HISTORY_PAGE_SIZE` on the web's `CreatorBroadcastHistoryScreen`. */
export const PAGE_SIZE = 20;

/** One `.metric-tile` — same five, same order, same icons and inks as the web. */
export interface Tile {
  key: string;
  icon: LucideIconName;
  color: string;
  label: string;
  value: string;
  barPct: number;
  caption: string;
  /** The web's per-tile `hint` string. */
  hint: string;
}

export const analyticsTiles = (a: BroadcastAnalytics): Tile[] => {
  const maxTk = Math.max(a.highlightedMessageTokens, a.rewardOrderTokens, a.funWheelSpinTokens, 1);
  const tokenBar = (tokens: number) => Math.min(100, Math.round((tokens / maxTk) * 100));
  return [
    {
      key: 'chat',
      hint: "How many chat messages viewers sent during this broadcast. Free to send — this doesn't earn coins on its own.",
      icon: 'message-circle',
      color: webColors.cyan,
      label: 'Chat messages',
      value: grouped(a.chatMessageCount),
      barPct: Math.min(100, Math.round((a.chatMessageCount / 5) * 100)),
      caption: 'sent',
    },
    {
      key: 'highlighted',
      hint: "Messages a viewer paid to highlight so it stands out in chat, plus the coins they earned you.",
      icon: 'star',
      color: webColors.gold,
      label: 'Highlighted',
      value: grouped(a.highlightedMessageCount),
      barPct: tokenBar(a.highlightedMessageTokens),
      caption: `${grouped(a.highlightedMessageTokens)} coins`,
    },
    {
      key: 'rewards',
      hint: "Shoutouts, song requests, and other rewards fans purchased during this broadcast, plus the coins earned.",
      icon: 'check',
      color: webColors.purple,
      label: 'Reward orders',
      value: grouped(a.rewardOrderCount),
      barPct: tokenBar(a.rewardOrderTokens),
      caption: `${grouped(a.rewardOrderTokens)} coins`,
    },
    {
      key: 'funwheel',
      hint: "How many times viewers paid to spin the fun wheel during this broadcast, plus the coins earned.",
      icon: 'clock-3',
      color: webColors.cyan,
      label: 'Fun-wheel spins',
      value: grouped(a.funWheelSpinCount),
      barPct: tokenBar(a.funWheelSpinTokens),
      caption: `${grouped(a.funWheelSpinTokens)} coins`,
    },
    {
      key: 'viewers',
      hint: "Total distinct viewers who watched any part of this broadcast, and the highest number watching at the same time.",
      icon: 'user-round',
      color: webColors.green,
      label: 'Unique viewers',
      value: grouped(a.totalUniqueViewers),
      barPct: Math.min(
        100,
        Math.round((a.totalUniqueViewers / Math.max(a.peakViewerCount, 1)) * 100),
      ),
      caption: `${a.peakViewerCount} at peak`,
    },
  ];
};

/**
 * The row's meta line — start time, duration, peak/total viewers, status
 * (+ end reason when present). Extracted from the row's inline JSX text
 * concatenation so it's independently testable.
 */
export const broadcastMetaLine = (item: BroadcastHistoryItem): string =>
  `${item.startedAtUtc ? webDateTime(item.startedAtUtc) : 'Unknown start'}` +
  ` · ${webDuration(item.durationSeconds)}` +
  ` · Peak ${item.peakViewerCount} viewers · ${item.totalUniqueViewers} total · ${item.status}` +
  `${item.endReason ? ` (${item.endReason})` : ''}`;
