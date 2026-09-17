import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen, SectionLabel, Skeleton } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { useBroadcastAnalytics } from '@hooks/useInsights';
import { usePendingRewardOrders } from '@hooks/useRewardOrders';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { grouped, initialsFrom, webDuration } from '@utils/format';
import { pressable } from '@utils/press';
import { rf } from '@utils/responsive';

import type { BroadcastAnalytics } from '@app-types/api';

type FeatherIconName = keyof typeof Feather.glyphMap;

/**
 * The four post-stream figures, straight off
 * `GET /api/artist/broadcast/{id}/analytics`.
 *
 * "New followers" used to sit here but the analytics payload has no such
 * field, so it is gone rather than guessed.
 */
const statsOf = (
  a: BroadcastAnalytics,
): { icon: FeatherIconName; label: string; value: string }[] => [
  { icon: 'eye', label: 'Peak viewers', value: grouped(a.peakViewerCount) },
  { icon: 'message-circle', label: 'Messages', value: grouped(a.chatMessageCount) },
  { icon: 'heart', label: 'Reactions', value: grouped(a.reactionCount) },
  { icon: 'gift', label: 'Rewards', value: grouped(a.rewardOrderCount) },
];

/** Post-stream recap. Flat sections — the numbers carry the page, not boxes. */
const BroadcastSummaryScreen = () => {
  const router = useRouter();
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();

  /** Leaving the summary always resets to the dashboard — the stream is over. */
  const toDashboard = () => router.replace('/(app)/(tabs)/home');

  const { data: analytics, isLoading } = useBroadcastAnalytics(broadcastId ?? null);
  const { data: pendingOrders } = usePendingRewardOrders();

  // Reward orders carry their broadcast, so the queue narrows to this show.
  const owed = (pendingOrders ?? []).filter((o) => o.broadcastId === broadcastId);

  return (
    <Screen scrollable padded={false} contentContainerStyle={styles.content}>
      <View style={styles.closeRow}>
        <Pressable
          onPress={toDashboard}
          style={pressable(styles.closeBtn)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close summary"
        >
          <Feather name="x" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Headline */}
      <Text variant="numHero" align="center">
        That&apos;s a wrap!
      </Text>
      {isLoading || !analytics ? (
        <Skeleton height={14} width="60%" round={6} style={styles.subtitleSkel} />
      ) : (
        <Text variant="bodySm" color="textMuted" align="center" style={styles.subtitle}>
          {analytics.title} · {webDuration(analytics.durationSeconds)}
        </Text>
      )}

      {/* Earnings */}
      <View style={styles.earned}>
        {isLoading || !analytics ? (
          <Skeleton height={rf(52)} width="45%" round={10} />
        ) : (
          <Text style={styles.earnedValue}>
            {analytics.totalRevenueTokens > 0
              ? `+${grouped(analytics.totalRevenueTokens)}`
              : '0'}
          </Text>
        )}
        <Text variant="label" color="green" style={styles.earnedUnit}>
          TK EARNED
        </Text>
      </View>

      {/* Stats — two flat columns, no cards */}
      <View style={styles.stats}>
        {(analytics ? statsOf(analytics) : []).map((s) => (
          <View key={s.label} style={styles.stat}>
            <View style={styles.statTop}>
              <Feather name={s.icon} size={rf(13)} color={colors.textMuted} />
              <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            <Text variant="h1" style={styles.statValue}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      {/* "Top supporters" was a fixture — the backend exposes no per-fan
          leaderboard for a broadcast. The real, actionable list after a show
          is what the artist still owes, which reward orders do provide. */}
      <SectionLabel divider style={styles.sectionLabel}>
        REWARDS TO DELIVER
      </SectionLabel>

      {owed.length === 0 ? (
        <Text variant="bodySm" color="textMuted" style={styles.emptyNote}>
          {isLoading
            ? 'Checking for reward orders…'
            : 'Nothing left to deliver from this show.'}
        </Text>
      ) : (
        owed.map((order, i) => (
          <View key={order.id} style={[styles.row, i === 0 ? null : styles.rowDivider]}>
            <Avatar
              initials={initialsFrom(order.buyerDisplayName)}
              name={order.buyerDisplayName}
              size="md"
              color={colors.violet}
            />

            <View style={styles.rowText}>
              <Text variant="bodyLg" color="textPrimary">
                {order.rewardName}
              </Text>
              <Text variant="bodySm" color="textMuted">
                for {order.buyerDisplayName}
              </Text>
            </View>

            <View style={styles.tag}>
              <Feather name="gift" size={rf(11)} color={colors.gold} />
              <Text variant="label" color="textMuted">
                {grouped(order.priceCharged)} TK
              </Text>
            </View>
          </View>
        ))
      )}

      {/* One container with an explicit `gap` owns the spacing between the
          three footer blocks. Per-element margins kept collapsing against one
          another; a gap on the parent cannot be. */}
      <View style={styles.footer}>
      {/* Actions */}
      <Pressable
        style={pressable(styles.cta)}
        onPress={toDashboard}
        accessibilityRole="button"
        accessibilityLabel="Back to dashboard"
      >
        <LinearGradient
          colors={gradients.cta}
          start={gradientDirection.horizontal.start}
          end={gradientDirection.horizontal.end}
          style={styles.ctaFill}
        >
          <Text style={styles.ctaLabel}>Back to Dashboard</Text>
        </LinearGradient>
      </Pressable>

      {/* The separate analytics page is gone — per-show figures live in
          Broadcast History, the same place the web keeps them. */}
      <Pressable
        style={pressable(styles.ghost)}
        onPress={() => router.replace('/(app)/(tabs)/calls/broadcast-history')}
        accessibilityRole="button"
        accessibilityLabel="View broadcast history"
      >
        {/* Centred on the Text itself — not inherited from the parent. */}
        <Text variant="bodyLg" color="pink" align="center" style={styles.strong}>
          View broadcast history
        </Text>
      </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  closeRow: {
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 6,
  },
  subtitleSkel: {
    alignSelf: 'center',
    marginTop: 8,
  },
  emptyNote: {
    paddingVertical: 14,
  },

  earned: {
    alignItems: 'center',
    marginTop: 28,
  },
  earnedValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(46),
    lineHeight: rf(52),
    letterSpacing: -1,
    color: colors.pink,
  },
  earnedUnit: {
    letterSpacing: 1.8,
    marginTop: 2,
  },

  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 22,
    marginTop: 32,
  },
  stat: {
    width: '50%',
    alignItems: 'center',
    gap: 4,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: fontFamily.extrabold,
  },

  sectionLabel: {
    marginTop: 30,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  footer: {
    marginTop: 28,
    gap: 36,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },

  cta: {
    // minHeight, not height — the bar can never be squeezed below the label.
    minHeight: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  // The radius is repeated on the gradient itself. `overflow: 'hidden'` on the
  // parent does not reliably clip a LinearGradient on Android, which is why
  // the bar was rendering with square corners.
  ctaFill: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ctaLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(15),
    color: colors.white,
  },
  ghost: {
    alignSelf: 'stretch',
    paddingVertical: 8,
  },
});

export default BroadcastSummaryScreen;
