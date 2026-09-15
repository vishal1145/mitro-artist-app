import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  EmptyState,
  InfoCallout,
  LoadFailed,
  PageHeader,
  Screen,
  Skeleton,
} from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { useFollowers } from '@hooks/useFollowers';
import { colors, fontFamily, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import type { ColorToken } from '@theme';
import type { Follower, FollowerBadge } from '@app-types/api';

type BadgeStyle = { label: string; tint: ColorToken; fill: string; border: string };

/** Visual per badge — mirrors artist-web's `followerBadgeClass` groupings. */
const BADGE_STYLE: Record<FollowerBadge, BadgeStyle> = {
  top_supporter: { label: 'TOP SUPPORTER', tint: 'green', fill: colors.successChip, border: colors.successBorder },
  new_follower: { label: 'NEW FOLLOWER', tint: 'pink', fill: colors.pinkSoft, border: colors.borderHot },
  session_regular: { label: 'SESSION REGULAR', tint: 'violet', fill: colors.violetSoft, border: colors.violetSoft },
  returning_fan: { label: 'RETURNING FAN', tint: 'cyan', fill: colors.cyanSoft, border: colors.infoBorder },
  follower: { label: 'FOLLOWER', tint: 'textMuted', fill: colors.surfaceSoft, border: colors.border },
};

const initialsFrom = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

/** "Followed 3 days ago" — only shown for a follower with zero paid interactions. */
const followedAgo = (iso: string): string => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Followed today';
  if (days === 1) return 'Followed yesterday';
  if (days < 30) return `Followed ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Followed ${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `Followed ${years} year${years === 1 ? '' : 's'} ago`;
};

const activityLine = (f: Follower): string =>
  f.interactionCount > 0
    ? `${grouped(f.totalCoinsSpent)} coins · ${f.interactionCount} interaction${f.interactionCount === 1 ? '' : 's'}`
    : followedAgo(f.followedAtUtc);

/** Followers list — engagement summary + every follower, tagged and dynamic. */
const FollowersScreen = () => {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useFollowers();
  const summary = data?.summary;
  const followers = data?.followers ?? [];

  const messageFollower = (f: Follower) =>
    router.push({
      pathname: '/(app)/(modals)/chat-thread',
      params: { userId: f.userId, name: f.displayName, avatarUrl: f.avatarUrl ?? '' },
    });

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.pink} />
      }
      header={
        <PageHeader
          title="Followers"
          onBack={() => router.back()}
          right={
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/(app)/(tabs)/me/messages')}
              accessibilityRole="button"
              accessibilityLabel="Open messages"
            >
              <Feather name="message-circle" size={rf(17)} color={colors.textPrimary} />
            </Pressable>
          }
        />
      }
    >
      <View style={styles.callout}>
        <InfoCallout icon="info" tone="info">
          This is your full follower list — everyone who follows you, tagged with badges like Top
          Supporter, Session Regular, and New Follower that show how engaged each fan is. Scan for
          the highest coin totals to spot who&apos;s worth a personal thank-you before you go live.
        </InfoCallout>
      </View>

      {isLoading ? (
        <View style={styles.pulseSkeleton}>
          <Skeleton width={140} height={40} round={12} />
          <Skeleton width="80%" height={14} round={7} />
        </View>
      ) : (
        <View style={styles.pulse}>
          <View style={styles.pulseHead}>
            <Feather name="heart" size={rf(12)} color={colors.pink} />
            <Text variant="label" color="textMuted">
              AUDIENCE PULSE
            </Text>
          </View>
          <Text variant="numHero">{summary ? grouped(summary.totalFollowers) : '—'}</Text>
          <Text variant="bodySm" color="textSecondary" style={styles.pulseSub}>
            {summary
              ? `${grouped(summary.newFollowersThisWeek)} new follower${summary.newFollowersThisWeek === 1 ? '' : 's'} joined this week with strong support from live gifts and paid sessions.`
              : 'Loading follower activity…'}
          </Text>

          <View style={styles.pulsePills}>
            <View style={styles.pill}>
              <Feather name="check" size={rf(12)} color={colors.green} />
              <Text variant="bodySm" color="textPrimary" style={styles.pillStrong}>
                {summary?.topSupporterCount ?? 0}
              </Text>
              <Text variant="bodySm" color="textMuted">
                top supporters
              </Text>
            </View>
            <View style={styles.pill}>
              <Feather name="users" size={rf(12)} color={colors.violet} />
              <Text variant="bodySm" color="textPrimary" style={styles.pillStrong}>
                {summary?.sessionRegularCount ?? 0}
              </Text>
              <Text variant="bodySm" color="textMuted">
                session regulars
              </Text>
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.row}>
              <Skeleton width={46} height={46} round={23} />
              <View style={styles.rowText}>
                <Skeleton width={90} height={14} round={7} />
                <Skeleton width={140} height={12} round={6} style={styles.skelGap} />
              </View>
              <Skeleton width={70} height={28} round={8} />
            </View>
          ))}
        </View>
      ) : isError ? (
        <LoadFailed message={getErrorMessage(error)} onRetry={refetch} />
      ) : followers.length === 0 ? (
        <EmptyState
          icon="users"
          title="No followers yet"
          description="Once fans favorite your profile, they'll show up here."
        />
      ) : (
        <View style={styles.list}>
          {followers.map((f, i) => {
            const badge = BADGE_STYLE[f.badge];
            return (
              <View key={f.userId} style={[styles.row, i === 0 ? null : styles.rowDivider]}>
                <Avatar
                  uri={f.avatarUrl ?? undefined}
                  initials={initialsFrom(f.displayName)}
                  name={f.displayName}
                  size="md"
                  color={f.avatarUrl ? undefined : colors.violet}
                />

                <View style={styles.rowText}>
                  <View style={[styles.tag, { backgroundColor: badge.fill, borderColor: badge.border }]}>
                    <Text variant="label" color={badge.tint}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={styles.name}>
                    {f.displayName}
                  </Text>
                  <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                    {activityLine(f)}
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  <Text variant="bodySm" color="gold" style={styles.coinsValue}>
                    {grouped(f.totalCoinsSpent)}
                  </Text>
                  <Pressable
                    style={styles.chatBtn}
                    onPress={() => messageFollower(f)}
                    accessibilityRole="button"
                    accessibilityLabel={`Message ${f.displayName}`}
                  >
                    <Feather name="message-circle" size={rf(13)} color={colors.textSecondary} />
                    <Text variant="label" color="textSecondary">
                      Message
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  callout: {
    marginTop: 12,
  },

  pulseSkeleton: {
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  pulse: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  pulseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pulseSub: {
    textAlign: 'center',
    marginTop: 6,
  },
  pulsePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillStrong: {
    fontFamily: fontFamily.bold,
  },

  list: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  skelGap: {
    marginTop: 6,
  },
  name: {
    fontFamily: fontFamily.bold,
  },
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  coinsValue: {
    fontFamily: fontFamily.extrabold,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

export default FollowersScreen;
