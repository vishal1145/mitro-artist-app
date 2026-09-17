import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  HelpIcon,
  WebCallout,
} from '@components/history';
import { LoadFailed, PageHeader, Screen, Skeleton } from '@components/shared';
import { LucideIcon } from '@components/ui';
import { Text } from '@components/ui';
import { useFollowers } from '@hooks/useFollowers';
import { colors, fontFamily, gradientDirection, layout, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

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

const RADIUS = 14; // --premium-radius (mobile)
const RADIUS_LG = 18; // --premium-radius-lg (mobile)

/* `data-tooltip` strings, verbatim from main.tsx. */
const HINT_PULSE =
  'Total number of fans who currently follow you, and how your following grew this week.';
const HINT_TOP_SUPPORTERS =
  "Followers who've spent 5,000+ coins supporting you — your highest-value fans.";
const HINT_SESSION_REGULARS =
  'Followers with 5+ paid interactions with you — they show up consistently, not just a one-time visit.';
const HINT_COINS =
  'Total coins this fan has spent supporting you, net of any refunds — matches what actually counts toward your earnings.';

/** `FOLLOWER_BADGE_LABEL` — sentence case, exactly as the web renders it. */
const BADGE_LABEL: Record<FollowerBadge, string> = {
  new_follower: 'New follower',
  top_supporter: 'Top supporter',
  session_regular: 'Session regular',
  returning_fan: 'Returning fan',
  follower: 'Follower',
};

/** `followerBadgeClass()` → `.f-badge.{top|new|returning|regular|sessions}`. */
const BADGE_TINT: Record<FollowerBadge, { ink: string; fill: string }> = {
  top_supporter: { ink: webColors.green, fill: webColors.badgeGreen },
  new_follower: { ink: webColors.cyan, fill: webColors.badgeCyan },
  returning_fan: { ink: webColors.gold, fill: webColors.badgeGold },
  session_regular: { ink: webColors.purple, fill: webColors.badgePurple },
  follower: { ink: webColors.pinkHot, fill: webColors.badgePink },
};

/** `followerInitials()`. */
const followerInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

/** `formatFollowedAgo()`. */
const formatFollowedAgo = (iso: string): string => {
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

const activityText = (f: Follower): string =>
  f.interactionCount > 0
    ? `${grouped(f.totalCoinsSpent)} coins · ${f.interactionCount} interaction${f.interactionCount === 1 ? '' : 's'}`
    : formatFollowedAgo(f.followedAtUtc);

/** One `.follower-card` skeleton — same block sizes the web renders. */
const CardSkeleton = () => (
  <View style={styles.card}>
    <Skeleton width={46} height={46} round={23} />
    <View style={styles.skelMain}>
      <Skeleton width={64} height={16} round={999} />
      <Skeleton width="60%" height={13} round={6} />
      <Skeleton width="40%" height={10} round={6} />
    </View>
    <View style={styles.skelRight}>
      <Skeleton width={74} height={12} round={6} />
      <Skeleton width={92} height={28} round={8} />
    </View>
  </View>
);

const FollowersScreen = () => {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useFollowers();
  const summary = data?.summary;
  const followers = data?.followers ?? [];

  const messageFollower = (f: Follower) =>
    router.push({
      pathname: '/(app)/(modals)/chat-thread',
      params: {
        userId: f.userId,
        name: f.displayName,
        avatarUrl: f.avatarUrl ?? '',
      },
    });

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={colors.pink}
        />
      }
      header={<PageHeader title="Followers" onBack={() => router.back()} />}
    >
      {/* .page-head */}
      <View style={styles.pageHead}>
        <Text style={styles.pageTitle}>Followers List</Text>
        <Text style={styles.pageSub}>
          See recent followers, top supporters, and engagement summaries.
        </Text>
      </View>

      {/* .info-callout — cyan, 3px left rule */}
      <WebCallout>
        <CalloutText>
          This is your full <CalloutStrong>follower list</CalloutStrong> — everyone who
          follows you, tagged with badges like{' '}
          <CalloutStrong>Top Supporter</CalloutStrong>,{' '}
          <CalloutStrong>Session Regular</CalloutStrong>, and{' '}
          <CalloutStrong>New Follower</CalloutStrong> that show how engaged each fan is.
          Scan for the highest coin totals and{' '}
          <CalloutStrong>Top Supporter</CalloutStrong> badges to spot who&apos;s worth a
          personal thank-you or an early heads-up before you go live.
        </CalloutText>
      </WebCallout>

      {/* .pulse-card */}
      <View style={styles.pulseCard}>
        {/* linear-gradient(160deg, #171331, #0a0918 70%) — the base layer */}
        <LinearGradient
          colors={webColors.pulseBase}
          start={{ x: 0.25, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          locations={[0, 0.7]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* radial-gradient(120% 160% at 90% 100%, purple, transparent 55%) */}
        <LinearGradient
          colors={[colors.transparent, webColors.pulsePurpleWash]}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* radial-gradient(120% 160% at 15% 0%, pink, transparent 55%) — on top */}
        <LinearGradient
          colors={[webColors.pulsePinkWash, colors.transparent]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.75, y: 0.8 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.pulseLeft}>
          {/* .eyebrow — pink pill (page-specific override of the gold default) */}
          <View style={styles.eyebrow}>
            <LucideIcon name="heart" size={rf(12)} color={webColors.pinkHot} />
            <Text style={styles.eyebrowText}>AUDIENCE PULSE</Text>
            <HelpIcon hint={HINT_PULSE} />
          </View>
          <Text style={styles.pulseBig}>
            {summary ? grouped(summary.totalFollowers) : '—'}
          </Text>
          <Text style={styles.pulseCopy}>
            {summary
              ? `${grouped(summary.newFollowersThisWeek)} new follower${summary.newFollowersThisWeek === 1 ? '' : 's'} joined this week with strong support from live gifts and paid sessions.`
              : 'Loading follower activity…'}
          </Text>
        </View>

        <View style={styles.pulsePills}>
          <View style={styles.pulsePill}>
            <LucideIcon name="check" size={rf(14)} color={webColors.gold} />
            <Text style={styles.pillStrong}>{summary?.topSupporterCount ?? 0}</Text>
            <Text style={styles.pillText}>top supporters</Text>
            <HelpIcon hint={HINT_TOP_SUPPORTERS} />
          </View>
          <View style={styles.pulsePill}>
            <LucideIcon name="users" size={rf(14)} color={webColors.gold} />
            <Text style={styles.pillStrong}>{summary?.sessionRegularCount ?? 0}</Text>
            <Text style={styles.pillText}>session regulars</Text>
            <HelpIcon hint={HINT_SESSION_REGULARS} />
          </View>
        </View>
      </View>

      {/* .follower-grid — one column at phone width (max-width: 720px) */}
      <View style={styles.grid}>
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <LoadFailed message={getErrorMessage(error)} onRetry={refetch} />
        ) : followers.length === 0 ? (
          <Text style={styles.dimHint}>
            No followers yet — once fans favorite your profile, they&apos;ll show up
            here.
          </Text>
        ) : (
          followers.map((f) => {
            const tint = BADGE_TINT[f.badge];
            return (
              <View key={f.userId} style={styles.card}>
                {f.avatarUrl ? (
                  <Image source={{ uri: f.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <LinearGradient
                    colors={webColors.avatarHot}
                    start={gradientDirection.diagonal.start}
                    end={gradientDirection.diagonal.end}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {followerInitials(f.displayName)}
                    </Text>
                  </LinearGradient>
                )}

                <View style={styles.main}>
                  <View style={[styles.badge, { backgroundColor: tint.fill }]}>
                    <Text style={[styles.badgeText, { color: tint.ink }]}>
                      {BADGE_LABEL[f.badge]}
                    </Text>
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {f.displayName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {activityText(f)}
                  </Text>
                </View>

                <View style={styles.right}>
                  {/* .f-coins — gold figure + the faint (?) beside it */}
                  <View style={styles.coinsRow}>
                    <Text style={styles.coins}>
                      {`${grouped(f.totalCoinsSpent)} coins`}
                    </Text>
                    <HelpIcon hint={HINT_COINS} />
                  </View>
                  <Pressable
                    style={styles.msgBtn}
                    onPress={() => messageFollower(f)}
                    accessibilityRole="button"
                    accessibilityLabel={`Message ${f.displayName}`}
                  >
                    <LucideIcon
                      name="message-circle"
                      size={rf(13)}
                      color={webColors.muted}
                    />
                    <Text style={styles.msgBtnText}>Message</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  /* .creator-view { display: grid; gap: 20px } */
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 20,
  },

  /* .page-head */
  pageHead: {
    marginTop: 12,
  },
  /* h1 — clamp(22px, 2.6vw, 28px) → 22 at phone width, 900, -0.01em */
  pageTitle: {
    marginBottom: 4,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    lineHeight: rf(27),
    letterSpacing: -0.22,
    color: webColors.textStrong,
  },
  /* p — 0.81rem, --premium-dim */
  pageSub: {
    fontFamily: fontFamily.regular,
    fontSize: rf(12.96),
    lineHeight: rf(18),
    color: webColors.dim,
  },

  /* .pulse-card — flex-wrap: wrap, so it stacks to a column at phone width */
  pulseCard: {
    gap: 20,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    borderRadius: RADIUS_LG,
    overflow: 'hidden',
  },
  pulseLeft: {},
  /* .followers-list-page .eyebrow — PINK pill override */
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: webColors.pinkChip,
    borderWidth: 1,
    borderColor: webColors.pinkChipBorder,
    borderRadius: 999,
  },
  /* 0.66rem / 800 / 0.05em / uppercase */
  eyebrowText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.56),
    letterSpacing: 0.53,
    color: webColors.pinkHot,
  },

  /* .pulse-left .big — clamp(32px, 4vw, 44px) → 32 at phone width */
  pulseBig: {
    marginBottom: 8,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(32),
    lineHeight: rf(38),
    letterSpacing: -0.32,
    color: webColors.textStrong,
  },
  /* .pulse-left p — 0.81rem / 1.5 / --premium-muted / max-width 420 */
  pulseCopy: {
    maxWidth: 420,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.96),
    lineHeight: rf(19.44),
    color: webColors.muted,
  },
  pulsePills: {
    gap: 8,
  },
  /* .pulse-pill — 0.78rem, surface-soft on the 13% border */
  pulsePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: webColors.surfaceSoft,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
  },

  /* .pulse-pill strong — --premium-text */
  pillStrong: {
    fontFamily: fontFamily.bold,
    fontSize: rf(12.48),
    color: webColors.textStrong,
  },
  pillText: {
    fontFamily: fontFamily.regular,
    fontSize: rf(12.48),
    color: webColors.muted,
  },

  /* .follower-grid / .follower-card */
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 17,
    backgroundColor: webColors.surface,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    borderRadius: RADIUS,
  },
  /* .f-avatar — 52px circle, linear-gradient(135deg, #ff3fad, #6b2df4) */
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* .f-avatar-img — object-fit: cover */
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    resizeMode: 'cover',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(17.6),
    color: colors.white,
  },
  /* .f-main { flex: 1; min-width: 0 } */
  main: {
    flex: 1,
    minWidth: 0,
  },
  /* .f-badge — 0.625rem / 800 / 0.03em */
  badge: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(15),
    letterSpacing: 0.3,
  },
  /* .f-main strong — 0.9rem / 700 */
  name: {
    fontFamily: fontFamily.bold,
    fontSize: rf(14.4),
    lineHeight: rf(20),
    color: webColors.textStrong,
  },

  /* .f-main small — 0.72rem / --premium-dim */
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: rf(11.52),
    lineHeight: rf(17),
    color: webColors.dim,
  },
  /* .f-right — column, right-aligned, gap 8 */
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  /* .f-coins — inline-flex, gap 4 */
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coins: {
    fontFamily: fontFamily.bold,
    fontSize: rf(14.08),
    color: webColors.gold,
  },
  /* .msg-btn — 0.72rem / 700 / surface-soft pill */
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 13,
    backgroundColor: webColors.surfaceSoft,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
  },

  msgBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(11.52),
    color: webColors.muted,
  },

  /* .dim-hint — 0.85rem, --text-soft fallback #9b9bab, 24px pad, centered */
  dimHint: {
    padding: 24,
    fontFamily: fontFamily.regular,
    fontSize: rf(13.6),
    lineHeight: rf(20),
    textAlign: 'center',
    color: webColors.dimHint,
  },

  /* Skeleton scaffolding inside .follower-card */
  skelMain: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  skelRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
});

export default FollowersScreen;
