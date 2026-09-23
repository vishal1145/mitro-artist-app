import { sourceLabel } from '@utils/earnings';

import type {
  BroadcastHistoryItem,
  EarningsTransaction,
  Follower,
  FollowerBadge,
} from '@app-types/api';

/** Rows a section shows before "See all" takes over. */
export const SECTION_LIMIT = 5;

/** Same badge wording the Followers screen uses. */
export const BADGE_LABEL: Record<FollowerBadge, string> = {
  top_supporter: 'TOP SUPPORTER',
  new_follower: 'NEW FOLLOWER',
  session_regular: 'SESSION REGULAR',
  returning_fan: 'RETURNING FAN',
  follower: 'FOLLOWER',
};

export const BADGE_TONE: Record<FollowerBadge, 'success' | 'primary' | 'neutral'> = {
  top_supporter: 'success',
  new_follower: 'primary',
  session_regular: 'primary',
  returning_fan: 'neutral',
  follower: 'neutral',
};

export const matches = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle);

/** Sessions matching `needle` across title/category/status, or the first page when `needle` is empty. */
export const filterSessions = (
  all: BroadcastHistoryItem[],
  needle: string,
): BroadcastHistoryItem[] => {
  if (!needle) return all.slice(0, SECTION_LIMIT);
  return all
    .filter(
      (s) =>
        matches(s.title, needle) ||
        matches(s.category, needle) ||
        matches(s.status, needle),
    )
    .slice(0, SECTION_LIMIT);
};

/** Followers matching `needle` by display name or badge label, or the first page when `needle` is empty. */
export const filterFollowers = (all: Follower[], needle: string): Follower[] => {
  if (!needle) return all.slice(0, SECTION_LIMIT);
  return all
    .filter(
      (f) =>
        matches(f.displayName, needle) || matches(BADGE_LABEL[f.badge], needle),
    )
    .slice(0, SECTION_LIMIT);
};

/** Transactions matching `needle` across description/sender/source/status/group-call title, or the first page when `needle` is empty. */
export const filterTransactions = (
  all: EarningsTransaction[],
  needle: string,
): EarningsTransaction[] => {
  if (!needle) return all.slice(0, SECTION_LIMIT);
  return all
    .filter(
      (t) =>
        matches(t.description, needle) ||
        matches(t.fromDisplayName, needle) ||
        matches(sourceLabel(t.sourceType), needle) ||
        matches(t.status, needle) ||
        matches(t.groupCallTitle ?? '', needle),
    )
    .slice(0, SECTION_LIMIT);
};
