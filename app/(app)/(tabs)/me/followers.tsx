import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

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
import { useDebounce } from '@hooks/useDebounce';
import { colors, fontFamily, fontSize, gradientDirection, gradients, layout, letterSpacing, lineHeight, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped } from '@utils/format';
import { rf, useAppWidth } from '@utils/responsive';

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

const RADIUS_LG = 8; // radius-v2.css: .pulse-card → var(--radius-base)

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

/** `.fl-card` meta line. */
const activityText = (f: Follower): string =>
  f.interactionCount > 0
    ? `${f.interactionCount} interaction${f.interactionCount === 1 ? '' : 's'}`
    : formatFollowedAgo(f.followedAtUtc);

type TabKey = 'all' | FollowerBadge;
const TABS: readonly { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'top_supporter', label: 'Top supporters' },
  { key: 'session_regular', label: 'Session regulars' },
  { key: 'new_follower', label: 'New followers' },
];

/** `.fl-scope .tone-*`. */
const TONE: Record<FollowerBadge, { ink: string; bg: string; border: string }> = {
  top_supporter: { ink: colors.success, bg: colors.successBg, border: colors.successBorder },
  session_regular: { ink: webColors.uploadInk, bg: colors.accentBg, border: colors.accentBorder },
  new_follower: { ink: colors.pink, bg: colors.accentBg, border: colors.borderHot },
  returning_fan: { ink: colors.info, bg: colors.infoSoft, border: colors.infoBorder },
  follower: { ink: colors.textMuted, bg: colors.surfaceHover, border: colors.border },
};

const MessageButton = ({ f, onPress }: { f: Follower; onPress: () => void }) => (
  <Pressable
    style={styles.msgBtn}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Message ${f.displayName}`}
  >
    <LucideIcon name="message-circle" size={rf(13)} color={colors.textMuted} />
    <Text style={styles.msgBtnText}>Message</Text>
  </Pressable>
);

const Initials = ({ name, style, textStyle }: { name: string; style: object; textStyle: object }) => (
  <LinearGradient
    colors={gradients.primary}
    start={gradientDirection.diagonal.start}
    end={gradientDirection.diagonal.end}
    style={style}
  >
    <Text style={textStyle}>{followerInitials(name)}</Text>
  </LinearGradient>
);

/** `.fl-skel` — 3:4 tile. */
const CardSkeleton = ({ width }: { width: number }) => (
  <View style={{ width }}>
    <Skeleton width="100%" height={Math.round(width * (4 / 3))} round={8} />
  </View>
);

const FollowersScreen = () => {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useFollowers();
  const summary = data?.summary;
  const followers = data?.followers ?? [];
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const winW = useAppWidth();
  /** `.fl-grid` — two columns at phone width, 16px gap. */
  const cardW = Math.floor((winW - layout.screenPadding * 2 - 16) / 2);

  const tabCount = (k: TabKey) =>
    k === 'all' ? followers.length : followers.filter((f) => f.badge === k).length;
  const needle = debouncedQuery.trim().toLowerCase();
  const visible = followers.filter(
    (f) => (tab === 'all' || f.badge === tab) && (needle === '' || f.displayName.toLowerCase().includes(needle)),
  );

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
            <View style={styles.pillHelp}>
              <HelpIcon hint={HINT_TOP_SUPPORTERS} />
            </View>
          </View>
          <View style={styles.pulsePill}>
            <LucideIcon name="users" size={rf(14)} color={webColors.gold} />
            <Text style={styles.pillStrong}>{summary?.sessionRegularCount ?? 0}</Text>
            <Text style={styles.pillText}>session regulars</Text>
            <View style={styles.pillHelp}>
              <HelpIcon hint={HINT_SESSION_REGULARS} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.scope}>
        <View style={styles.toolbar}>
          <View style={styles.search}>
            <LucideIcon name="search" size={rf(15)} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search followers"
              placeholderTextColor={colors.textDim}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={on ? styles.tabOn : styles.tab}
                >
                  {on ? (
                    <LinearGradient
                      colors={gradients.primary}
                      start={gradientDirection.diagonal.start}
                      end={gradientDirection.diagonal.end}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  <Text style={on ? styles.tabTextOn : styles.tabText}>{t.label}</Text>
                  <Text style={[on ? styles.tabTextOn : styles.tabText, styles.tabCount]}>
                    {tabCount(t.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.grid}>
          {isLoading ? (
            [0, 1, 2, 3].map((i) => <CardSkeleton key={i} width={cardW} />)
          ) : isError ? (
            <LoadFailed message={getErrorMessage(error)} onRetry={refetch} />
          ) : followers.length === 0 ? (
            <Text style={styles.dimHint}>
              No followers yet — once fans favorite your profile, they&apos;ll show up here.
            </Text>
          ) : visible.length === 0 ? (
            <Text style={styles.dimHint}>No followers match this view.</Text>
          ) : (
            visible.map((f) => {
              const tone = TONE[f.badge];
              return (
                <View key={f.userId} style={[styles.flCard, { width: cardW }]}>
                  <View style={styles.photo}>
                    {f.avatarUrl ? (
                      <Image source={{ uri: f.avatarUrl }} style={styles.photoImg} />
                    ) : (
                      <Initials name={f.displayName} style={styles.photoImg} textStyle={styles.photoInitials} />
                    )}
                    <View
                      style={[
                        styles.flBadge,
                        { backgroundColor: tone.bg, borderColor: tone.border },
                      ]}
                    >
                      <Text style={[styles.flBadgeText, { color: tone.ink }]} numberOfLines={1}>
                        {BADGE_LABEL[f.badge]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.flBody}>
                    <Text style={styles.flName} numberOfLines={1}>{f.displayName}</Text>
                    <Text style={styles.flSmall} numberOfLines={1}>{activityText(f)}</Text>
                    <View style={styles.coinsRow}>
                      <Text style={styles.coins}>{`${grouped(f.totalCoinsSpent)} coins`}</Text>
                      <HelpIcon hint={HINT_COINS} />
                    </View>
                  </View>
                  <MessageButton f={f} onPress={() => messageFollower(f)} />
                </View>
              );
            })
          )}
        </View>
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
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    color: webColors.textStrong,
  },
  /* p — 0.81rem, --premium-dim */
  pageSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    color: webColors.dim,
  },

  /* .pulse-card — flex-wrap: wrap, so it stacks to a column at phone width */
  pulseCard: {
    gap: 16,
    padding: 16,
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
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.small,
    color: webColors.pinkHot,
  },

  /* .pulse-left .big — clamp(32px, 4vw, 44px) → 32 at phone width */
  pulseBig: {
    marginBottom: 8,
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    color: webColors.textStrong,
  },
  /* .pulse-left p — 0.81rem / 1.5 / --premium-muted / max-width 420 */
  pulseCopy: {
    maxWidth: 420,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    color: webColors.muted,
  },
  pulsePills: {
    flexDirection: 'row',
    gap: 12,
  },
  pillHelp: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  /* .pulse-pill — 0.78rem, surface-soft on the 13% border */
  pulsePill: {
    alignItems: 'flex-start',
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 0,
    padding: 12,
  },

  /* .pulse-pill strong — --premium-text */
  pillStrong: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.subheading,
    lineHeight: lineHeight.subheading,
    color: webColors.textStrong,
  },
  pillText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: webColors.muted,
  },

  /* .fl-scope — gap-section 32 */
  scope: { gap: 32 },
  flHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flHeadTitle: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  flH2: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.subheading,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
  },
  flMeta: { color: colors.textDim, fontFamily: fontFamily.regular, fontSize: fontSize.small },
  flSmall: { color: colors.textDim, fontFamily: fontFamily.regular, fontSize: fontSize.xs },

  topGrid: { gap: 16 },
  topCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    overflow: 'hidden',
    padding: 16,
  },
  topCardGold: {},
  rank: {
    color: colors.textDim,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  rankGold: { color: colors.warning },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  topAvatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  topInitials: { color: colors.white, fontFamily: fontFamily.bold, fontSize: fontSize.body },
  topMain: { flex: 1, gap: 4, minWidth: 0 },
  topName: { color: colors.text, fontFamily: fontFamily.bold, fontSize: fontSize.body },
  topCoins: {
    color: colors.warning,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.subheading,
    lineHeight: lineHeight.subheading,
  },
  topCoinsSmall: { color: colors.textDim, fontFamily: fontFamily.regular, fontSize: fontSize.xs },

  toolbar: { gap: 12 },
  search: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    minWidth: 0,
    paddingVertical: 0,
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabOn: {
    alignItems: 'center',
    borderColor: colors.transparent,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabText: { color: colors.textMuted, fontFamily: fontFamily.medium, fontSize: fontSize.small },
  tabTextOn: { color: colors.text, fontFamily: fontFamily.medium, fontSize: fontSize.small },
  tabCount: { fontSize: fontSize.xs, opacity: 0.8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  flCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  photo: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  photoImg: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  photoInitials: { color: colors.white, fontFamily: fontFamily.bold, fontSize: fontSize.headingLg },
  flBadge: {
    borderRadius: 999,
    borderWidth: 1,
    left: 8,
    maxWidth: '90%',
    paddingHorizontal: 8,
    position: 'absolute',
    top: 8,
  },
  flBadgeText: { fontFamily: fontFamily.bold, fontSize: fontSize.xs },
  flBody: { gap: 4, minWidth: 0 },
  flName: { color: colors.text, fontFamily: fontFamily.bold, fontSize: fontSize.small },
  coinsRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  coins: { color: colors.warning, fontFamily: fontFamily.bold, fontSize: fontSize.small },
  msgBtn: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 32,
    justifyContent: 'center',
    marginTop: 'auto',
  },
  msgBtnText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: fontSize.small },

  /* .dim-hint — 0.85rem, --text-soft fallback #9b9bab, 24px pad, centered */
  dimHint: {
    padding: 24,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
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
