import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';

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
import { FollowerCard } from '@screens/profile/followers/components/FollowerCard';
import {
  HINT_PULSE,
  HINT_SESSION_REGULARS,
  HINT_TOP_SUPPORTERS,
  RADIUS,
  RADIUS_LG,
} from '@screens/profile/followers/formatters';
import { colors, fontFamily, layout, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import type { Follower } from '@app-types/api';

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
          followers.map((f) => (
            <FollowerCard key={f.userId} follower={f} onMessage={() => messageFollower(f)} />
          ))
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
  /* Also the outer box of `CardSkeleton`, matching `.follower-card`'s box. */
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
