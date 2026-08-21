import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EarningsBar, EmptyState, Screen, Skeleton } from '@components/shared';
import { Card, Text } from '@components/ui';
import { useBroadcastHistory, useEarningsSummary } from '@hooks/useInsights';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { compactCount, duration, formatTokens, shortDate, shortWeekday } from '@utils/format';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

/** How many past broadcasts the Home timeline shows. */
const RECENT_COUNT = 3;

/**
 * A broadcast that ended cleanly gets a green dot; anything else — a dropped
 * connection, a timeout — gets gold, so the timeline flags it at a glance.
 */
const CLEAN_END = 'Ended by artist';

type AlertRoute =
  | '/(app)/(tabs)/home/reward-fulfillment'
  | '/(app)/(tabs)/home/notifications';

const ALERTS: {
  id: string;
  icon: FeatherIconName;
  tint: string;
  fill: string;
  title: string;
  body: string;
  unread?: boolean;
  route: AlertRoute;
}[] = [
  {
    id: 'a1',
    icon: 'gift',
    tint: colors.pink,
    fill: colors.pinkSoft,
    title: 'Rewards',
    body: '3 waiting · 1 due today',
    unread: true,
    route: '/(app)/(tabs)/home/reward-fulfillment',
  },
  {
    id: 'a2',
    icon: 'star',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'System',
    body: '48K followers unlocked · 2h',
    route: '/(app)/(tabs)/home/notifications',
  },
];

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

const HomeScreen = () => {
  const router = useRouter();

  const { data: earnings, isLoading: loadingEarnings } = useEarningsSummary();
  const { data: broadcasts, isLoading: loadingBroadcasts } =
    useBroadcastHistory(RECENT_COUNT);

  // Followers and Shows have no endpoint yet and stay hardcoded; Pending and
  // Total come from /earnings/summary.
  const stats = [
    {
      value: earnings ? formatTokens(earnings.pendingTokens) : '—',
      label: 'Pending',
      color: 'gold' as const,
      route: '/(app)/(tabs)/business' as const,
    },
    {
      value: earnings ? formatTokens(earnings.totalTokens) : '—',
      label: 'Total',
      color: 'green' as const,
      route: '/(app)/(tabs)/business/transactions' as const,
    },
    {
      value: '48.2K',
      label: 'Followers',
      color: 'pink' as const,
      route: '/(app)/(tabs)/me/followers' as const,
    },
    {
      value: '12',
      label: 'Shows',
      color: 'cyan' as const,
      route: '/(app)/(tabs)/calls/broadcast-history' as const,
    },
  ];

  // Bars are drawn as a fraction of the busiest day, so a quiet week still
  // fills the chart rather than flatlining. An all-zero week draws nothing.
  const week = earnings?.last7Days ?? [];
  const peakDay = Math.max(...week.map((d) => d.tokens), 0);
  const weekTotal = week.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread
        />
      }
    >

      {/* Heading */}
      <Text variant="h1" style={styles.title}>
        Creator Hub
      </Text>

      {/* Prime-time tip */}
      <View style={styles.tip}>
        <Text variant="bodySm" color="textSecondary" style={styles.tipText}>
          <Text style={styles.tipStrong}>Prime time ~9 PM</Text> — schedule tonight
        </Text>
        <Pressable
          style={styles.helpChip}
          accessibilityRole="button"
          accessibilityLabel="Why this time?"
        >
          <Text style={styles.helpMark} color="textMuted">
            ?
          </Text>
        </Pressable>
      </View>

      {/* Primary actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push('/(app)/(tabs)/live')}
          accessibilityRole="button"
          accessibilityLabel="Start Live"
        >
          <LinearGradient
            colors={gradients.cta}
            start={gradientDirection.horizontal.start}
            end={gradientDirection.horizontal.end}
            style={styles.actionFill}
          >
            <Feather name="video" size={rf(16)} color={colors.white} />
            <Text style={styles.actionLabel}>Start Live</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.actionOutline]}
          onPress={() => router.push('/(app)/(tabs)/calls/schedule-session')}
          accessibilityRole="button"
          accessibilityLabel="Schedule a session"
        >
          <Feather name="calendar" size={rf(16)} color={colors.textPrimary} />
          <Text style={styles.actionLabel}>Schedule</Text>
        </Pressable>
      </View>

      {/* Inline stats */}
      <View style={styles.stats}>
        {stats.map((s) => (
          <Pressable
            key={s.label}
            style={styles.stat}
            onPress={() => router.push(s.route)}
            accessibilityRole="button"
            accessibilityLabel={`${s.value} ${s.label}`}
          >
            {loadingEarnings ? (
              <Skeleton width={56} height={20} round={10} />
            ) : (
              <Text variant="h2" color={s.color} style={styles.statValue}>
                {s.value}
              </Text>
            )}
            <Text variant="bodySm" color="textMuted">
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Analytics */}
      <Card style={styles.analytics}>
        <View style={styles.analyticsHead}>
          <Text variant="h3">Analytics Overview</Text>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/calls/broadcast-history')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Analytics details"
          >
            <Text variant="bodyLg" color="pink">
              Details
            </Text>
          </Pressable>
        </View>

        <View style={styles.chart}>
          {week.map((day) => {
            const height: `${number}%` = peakDay
              ? `${(day.tokens / peakDay) * 100}%`
              : '0%';

            return (
              <View key={day.date} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={gradients.cta}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.bar, { height }]}
                  />
                </View>
                <Text variant="bodySm" color="textMuted" style={styles.barLabel}>
                  {shortWeekday(day.date)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.pink }]} />
            <Text variant="bodySm" color="textMuted">
              Best day
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.violet }]} />
            <Text variant="bodySm" color="textMuted">
              tokens/day
            </Text>
          </View>
          <Text variant="bodySm" color="textMuted" style={styles.legendSummary}>
            This week: <Text style={styles.legendStrong}>{formatTokens(weekTotal)}</Text>
          </Text>
        </View>
      </Card>

      {/* Recent broadcasts */}
      <Text variant="label" color="textMuted" style={styles.sectionLabel}>
        Recent Broadcasts
      </Text>
      <View style={styles.broadcasts}>
        {loadingBroadcasts ? (
          <View style={styles.broadcastSkeleton}>
            <Skeleton height={38} round={radius.md} />
            <Skeleton height={38} round={radius.md} />
            <Skeleton height={38} round={radius.md} />
          </View>
        ) : !broadcasts?.length ? (
          <EmptyState
            icon="video"
            title="No broadcasts yet"
            description="Your first show will show up here."
          />
        ) : (
          broadcasts.map((b, i) => {
            const last = i === broadcasts.length - 1;
            const viewers = compactCount(b.totalUniqueViewers);

            return (
              <Pressable
                key={b.broadcastId}
                style={[styles.broadcastRow, last ? styles.broadcastRowLast : null]}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/home/broadcast-detail',
                    params: { broadcastId: b.broadcastId },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={b.title}
              >
                {/* Timeline rail — runs from this dot down to the next one. */}
                {last ? null : <View style={styles.timeline} />}
                <View style={styles.gutter}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          b.endReason === CLEAN_END ? colors.green : colors.gold,
                      },
                    ]}
                  />
                </View>
                <View style={styles.broadcastText}>
                  <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
                    {b.title}
                  </Text>
                  <View style={styles.broadcastMeta}>
                    <Text
                      variant="bodySm"
                      color="textMuted"
                      style={styles.broadcastMetaText}
                      numberOfLines={1}
                    >
                      {shortDate(b.startedAtUtc)} · {duration(b.durationSeconds)} ·{' '}
                      {viewers} {b.totalUniqueViewers === 1 ? 'viewer' : 'viewers'}
                    </Text>
                    <Text variant="bodySm" color="green" style={styles.broadcastEarned}>
                      +{b.totalRevenueTokens} tk
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Alerts */}
      <Text variant="label" color="textMuted" style={[styles.sectionLabel, styles.sectionRule]}>
        Alerts
      </Text>
      <View style={styles.alerts}>
        {ALERTS.map((a) => (
          <Pressable
            key={a.id}
            style={styles.alertRow}
            onPress={() => router.push(a.route)}
            accessibilityRole="button"
            accessibilityLabel={`${a.title}. ${a.body}`}
          >
            <View style={[styles.alertIcon, { backgroundColor: a.fill }]}>
              <Feather name={a.icon} size={rf(16)} color={a.tint} />
            </View>

            <View style={styles.alertText}>
              <Text variant="bodyLg" color="textPrimary">
                {a.title}
              </Text>
              <Text variant="bodySm" color="textMuted">
                {a.body}
              </Text>
            </View>

            {a.unread ? <View style={styles.alertUnread} /> : null}
            <Feather name="chevron-right" size={rf(15)} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
};

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  // Heading
  title: {
    marginTop: 12,
    marginBottom: 16,
  },

  // Tip
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
  },
  tipStrong: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  helpChip: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpMark: {
    fontFamily: fontFamily.bold,
    fontSize: rf(10),
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionFill: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionOutline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(12),
    color: colors.white,
  },

  // Stats
  stats: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.extrabold,
  },

  // Analytics
  analytics: {
    gap: 16,
    marginBottom: 24,
  },
  analyticsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 130,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  barLabel: {
    fontSize: rf(10),
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendSummary: {
    flex: 1,
    textAlign: 'right',
  },
  legendStrong: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },

  // Sections
  sectionLabel: {
    marginBottom: 12,
  },
  // Separates Alerts from the broadcast timeline above it.
  sectionRule: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },

  // Broadcasts — a timeline: fixed dot gutter on the left, rail linking the dots.
  broadcasts: {
    marginBottom: 24,
  },
  broadcastSkeleton: {
    gap: 14,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    // Row owns the gap so the rail can run through it to the next dot.
    paddingBottom: 16,
  },
  broadcastRowLast: {
    paddingBottom: 0,
  },
  // Centred under the dot (gutter 8 wide -> 3.5 for a 1.5pt rail).
  timeline: {
    position: 'absolute',
    left: 3.5,
    top: 16,
    bottom: -6,
    width: 1.5,
    backgroundColor: colors.cardRaised,
  },
  gutter: {
    width: 8,
    alignItems: 'center',
    paddingTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  broadcastText: {
    flex: 1,
    gap: 3,
  },
  broadcastMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Meta takes the slack so every "+xxx tk" lands on the right edge, forming a
  // clean column instead of trailing its own meta line with dead space after.
  broadcastMetaText: {
    flex: 1,
  },
  broadcastEarned: {
    fontFamily: fontFamily.bold,
  },

  // Alerts
  alerts: {
    gap: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 14,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    gap: 2,
  },
  alertUnread: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
});

export default HomeScreen;
