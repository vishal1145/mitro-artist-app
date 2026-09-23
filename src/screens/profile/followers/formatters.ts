import { webColors } from '@theme';
import { grouped } from '@utils/format';

import type { Follower, FollowerBadge } from '@app-types/api';

/* -------------------------------------------------------------------------- */
/*  Artist web — `.followers-list-page` in styles.css, 1:1.                    */
/*                                                                            */
/*  Every number below is the web's own value. rem → px at the browser's 16px  */
/*  root: 0.625rem = 10, 0.66rem = 10.56, 0.72rem = 11.52, 0.75rem = 12,       */
/*  0.78rem = 12.48, 0.81rem = 12.96, 0.85rem = 13.6, 0.88rem = 14.08,         */
/*  0.9rem = 14.4, 1.1rem = 17.6. The `clamp()` sizes resolve to their lower   */
/*  bound at phone width, and `--premium-radius`/`-lg` drop to 14/18 in the    */
/*  mobile block (`@media (max-width: 768px)` re-declares them).               */
/* -------------------------------------------------------------------------- */

export const RADIUS = 14; // --premium-radius (mobile)
export const RADIUS_LG = 18; // --premium-radius-lg (mobile)

/* `data-tooltip` strings, verbatim from main.tsx. */
export const HINT_PULSE =
  'Total number of fans who currently follow you, and how your following grew this week.';
export const HINT_TOP_SUPPORTERS =
  "Followers who've spent 5,000+ coins supporting you — your highest-value fans.";
export const HINT_SESSION_REGULARS =
  'Followers with 5+ paid interactions with you — they show up consistently, not just a one-time visit.';
export const HINT_COINS =
  'Total coins this fan has spent supporting you, net of any refunds — matches what actually counts toward your earnings.';

/** `FOLLOWER_BADGE_LABEL` — sentence case, exactly as the web renders it. */
export const BADGE_LABEL: Record<FollowerBadge, string> = {
  new_follower: 'New follower',
  top_supporter: 'Top supporter',
  session_regular: 'Session regular',
  returning_fan: 'Returning fan',
  follower: 'Follower',
};

/** `followerBadgeClass()` → `.f-badge.{top|new|returning|regular|sessions}`. */
export const BADGE_TINT: Record<FollowerBadge, { ink: string; fill: string }> = {
  top_supporter: { ink: webColors.green, fill: webColors.badgeGreen },
  new_follower: { ink: webColors.cyan, fill: webColors.badgeCyan },
  returning_fan: { ink: webColors.gold, fill: webColors.badgeGold },
  session_regular: { ink: webColors.purple, fill: webColors.badgePurple },
  follower: { ink: webColors.pinkHot, fill: webColors.badgePink },
};

/** `followerInitials()`. */
export const followerInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

/** `formatFollowedAgo()`. */
export const formatFollowedAgo = (iso: string): string => {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Followed today';
  if (diffDays === 1) return 'Followed yesterday';
  if (diffDays < 30) return `Followed ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12)
    return `Followed ${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `Followed ${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
};

export const activityText = (f: Follower): string =>
  f.interactionCount > 0
    ? `${grouped(f.totalCoinsSpent)} coins · ${f.interactionCount} interaction${f.interactionCount === 1 ? '' : 's'}`
    : formatFollowedAgo(f.followedAtUtc);
