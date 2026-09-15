import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  EmptyState,
  InfoCallout,
  LoadFailed,
  PageHeader,
  ProgressBar,
  Screen,
  SectionLabel,
  Skeleton,
} from '@components/shared';
import { Text } from '@components/ui';
import {
  useBroadcastAnalytics,
  useBroadcastHistory,
  useBroadcastHistorySummary,
} from '@hooks/useInsights';
import { useFulfillRewardOrderMutation, usePendingRewardOrders } from '@hooks/useRewardOrders';
import { colors, fontFamily, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { duration, grouped, shortDateTime } from '@utils/format';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

import type { BroadcastAnalytics, BroadcastHistoryItem, RewardOrder } from '@app-types/api';

const HISTORY_TAKE = 30;

/** One metric tile inside an expanded broadcast's analytics grid. */
interface Tile {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  label: string;
  value: string;
  caption: string;
  barPct: number;
}

const analyticsTiles = (a: BroadcastAnalytics): Tile[] => {
  const maxTk = Math.max(a.highlightedMessageTokens, a.rewardOrderTokens, a.funWheelSpinTokens, 1);
  return [
    {
      key: 'chat',
      icon: 'message-circle',
      tint: colors.cyan,
      label: 'Chat messages',
      value: grouped(a.chatMessageCount),
      caption: 'sent',
      barPct: Math.min(100, Math.round((a.chatMessageCount / 5) * 100)),
    },
    {
      key: 'highlighted',
      icon: 'star',
      tint: colors.gold,
      label: 'Highlighted',
      value: grouped(a.highlightedMessageCount),
      caption: `${grouped(a.highlightedMessageTokens)} tk`,
      barPct: Math.min(100, Math.round((a.highlightedMessageTokens / maxTk) * 100)),
    },
    {
      key: 'rewards',
      icon: 'gift',
      tint: colors.purple,
      label: 'Reward orders',
      value: grouped(a.rewardOrderCount),
      caption: `${grouped(a.rewardOrderTokens)} tk`,
      barPct: Math.min(100, Math.round((a.rewardOrderTokens / maxTk) * 100)),
    },
    {
      key: 'funwheel',
      icon: 'rotate-cw',
      tint: colors.cyan,
      label: 'Fun-wheel spins',
      value: grouped(a.funWheelSpinCount),
      caption: `${grouped(a.funWheelSpinTokens)} tk`,
      barPct: Math.min(100, Math.round((a.funWheelSpinTokens / maxTk) * 100)),
    },
    {
      key: 'viewers',
      icon: 'users',
      tint: colors.green,
      label: 'Unique viewers',
      value: grouped(a.totalUniqueViewers),
      caption: `${a.peakViewerCount} at peak`,
      barPct: Math.min(100, Math.round((a.totalUniqueViewers / Math.max(a.peakViewerCount, 1)) * 100)),
    },
  ];
};

/** Solo broadcast history — lifetime totals, reward queue, and every past show with analytics. */
const BroadcastHistoryScreen = () => {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const {
    data: history,
    isLoading: loadingHistory,
    isError: historyError,
    error: historyErrorObj,
    refetch: refetchHistory,
    isRefetching,
  } = useBroadcastHistory(HISTORY_TAKE, 0);
  const { data: summary, isLoading: loadingSummary } = useBroadcastHistorySummary();
  const { data: pendingOrders, isLoading: loadingOrders } = usePendingRewardOrders();
  const { data: analytics, isLoading: loadingAnalytics } = useBroadcastAnalytics(expandedId);
  const fulfillMutation = useFulfillRewardOrderMutation();

  const toggleExpand = (broadcastId: string) =>
    setExpandedId((current) => (current === broadcastId ? null : broadcastId));

  const handleFulfill = async (order: RewardOrder) => {
    setFulfillingId(order.id);
    try {
      const result = await fulfillMutation.mutateAsync(order.id);
      showToast(result.message ?? `Marked "${order.rewardName}" delivered.`, 'success');
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setFulfillingId(null);
    }
  };

  const summaryAvgLength =
    summary?.avgDurationSeconds != null ? duration(summary.avgDurationSeconds) : '—';

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetchHistory()} tintColor={colors.pink} />
      }
      header={<PageHeader title="Broadcasts" onBack={() => router.back()} />}
    >
      <View style={styles.callout}>
        <InfoCallout icon="info" tone="info">
          Every past solo broadcast you&apos;ve hosted, with peak viewers and earnings for each
          show at a glance. Tap Analytics on any show to see the chat, reward, and fun-wheel
          breakdown that made up its total.
        </InfoCallout>
      </View>

      {loadingSummary ? (
        <View style={styles.statGrid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={74} round={radius.card} style={styles.statSkel} />
          ))}
        </View>
      ) : (
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            <StatCell icon="radio" tint={colors.pink} label="Shows" value={String(summary?.totalShows ?? 0)} />
            <StatCell
              icon="dollar-sign"
              tint={colors.gold}
              label="Total earned"
              value={`${grouped(summary?.totalRevenueTokens ?? 0)} tk`}
            />
          </View>
          <View style={styles.statRow}>
            <StatCell
              icon="users"
              tint={colors.cyan}
              label="Unique viewers"
              value={grouped(summary?.totalUniqueViewers ?? 0)}
            />
            <StatCell icon="clock" tint={colors.green} label="Avg length" value={summaryAvgLength} />
          </View>
        </View>
      )}

      {!loadingOrders && pendingOrders && pendingOrders.length > 0 ? (
        <>
          <View style={styles.callout}>
            <InfoCallout icon="alert-triangle" tone="warning">
              Fulfill rewards promptly — fans notice when a shoutout or song request never
              arrives. Quick delivery keeps them confident enough to tip and book again.
            </InfoCallout>
          </View>

          <View style={styles.rewardsCard}>
            <Text variant="label" color="textMuted">
              TO FULFILL
            </Text>
            <Text variant="h3" style={styles.rewardsHeading}>
              Pending Reward Deliveries
            </Text>
            {pendingOrders.map((order, i) => (
              <View key={order.id} style={[styles.pendingRow, i === 0 ? null : styles.pendingRowDivider]}>
                <Text variant="bodySm" color="textSecondary" style={styles.pendingWho} numberOfLines={2}>
                  <Text variant="bodySm" color="textPrimary" style={styles.strong}>
                    {order.rewardName}
                  </Text>{' '}
                  for {order.buyerDisplayName} ·{' '}
                  <Text variant="bodySm" color="gold" style={styles.strong}>
                    {grouped(order.priceCharged)} tk
                  </Text>
                </Text>
                <Pressable
                  style={styles.fulfillBtn}
                  onPress={() => handleFulfill(order)}
                  disabled={fulfillingId === order.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${order.rewardName} fulfilled`}
                >
                  <Feather name="check" size={rf(12)} color={colors.textPrimary} />
                  <Text variant="bodySm" color="textPrimary">
                    {fulfillingId === order.id ? 'Marking…' : 'Mark fulfilled'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SectionLabel divider style={styles.sectionLabel}>
        PAST BROADCASTS
      </SectionLabel>

      {loadingHistory ? (
        <View style={styles.showSkel}>
          <Skeleton height={64} round={radius.card} />
          <Skeleton height={64} round={radius.card} />
          <Skeleton height={64} round={radius.card} />
        </View>
      ) : historyError ? (
        <LoadFailed message={getErrorMessage(historyErrorObj)} onRetry={refetchHistory} />
      ) : !history || history.length === 0 ? (
        <EmptyState
          icon="video"
          title="No broadcasts yet"
          description="They'll show up here once you end a live show."
        />
      ) : (
        history.map((item: BroadcastHistoryItem) => {
          const isExpanded = expandedId === item.broadcastId;
          return (
            <View key={item.broadcastId} style={[styles.showCard, isExpanded ? styles.showCardOpen : null]}>
              <Pressable
                style={styles.showRow}
                onPress={() => toggleExpand(item.broadcastId)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${isExpanded ? 'hide' : 'show'} analytics`}
              >
                <View style={styles.showIcon}>
                  <Feather name="radio" size={rf(16)} color={colors.pink} />
                </View>
                <View style={styles.showMain}>
                  <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={styles.strong}>
                    {item.title}
                  </Text>
                  <Text variant="bodySm" color="textMuted" numberOfLines={2}>
                    {item.startedAtUtc ? shortDateTime(item.startedAtUtc) : 'Unknown start'} ·{' '}
                    {duration(item.durationSeconds)} · Peak {item.peakViewerCount} viewers ·{' '}
                    {item.totalUniqueViewers} total
                    {item.endReason ? ` · ${item.endReason}` : ''}
                  </Text>
                </View>
                <View style={styles.showRight}>
                  <Text
                    variant="bodySm"
                    color={item.totalRevenueTokens > 0 ? 'green' : 'textMuted'}
                    style={styles.strong}
                  >
                    {item.totalRevenueTokens > 0 ? `+${grouped(item.totalRevenueTokens)}` : '0'}
                  </Text>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'bar-chart-2'}
                    size={rf(14)}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>

              {isExpanded ? (
                <View style={styles.showDetail}>
                  {loadingAnalytics || !analytics || analytics.broadcastId !== item.broadcastId ? (
                    <View style={styles.analyticsSkel}>
                      <Skeleton height={70} round={radius.md} />
                      <Skeleton height={70} round={radius.md} />
                    </View>
                  ) : (
                    <View style={styles.metricGrid}>
                      {analyticsTiles(analytics).map((t) => (
                        <View key={t.key} style={styles.metricTile}>
                          <View style={styles.metricTop}>
                            <Feather name={t.icon} size={rf(12)} color={t.tint} />
                            <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                              {t.label}
                            </Text>
                          </View>
                          <Text variant="h3" style={styles.metricValue}>
                            {t.value}
                          </Text>
                          <ProgressBar value={t.barPct / 100} height={4} style={styles.metricBar} />
                          <Text variant="bodySm" color="textMuted">
                            {t.caption}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </Screen>
  );
};

const StatCell = ({
  icon,
  tint,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  label: string;
  value: string;
}) => (
  <View style={styles.statCell}>
    <View style={styles.statIcon}>
      <Feather name={icon} size={rf(15)} color={tint} />
    </View>
    <View style={styles.statText}>
      <Text variant="bodySm" color="textMuted" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="h3" style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  callout: {
    marginTop: 12,
  },

  statGrid: {
    marginTop: 16,
    gap: 10,
  },
  statSkel: {
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 12,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  statValue: {
    fontFamily: fontFamily.extrabold,
  },

  rewardsCard: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.card,
    padding: 16,
  },
  rewardsHeading: {
    marginTop: 4,
    marginBottom: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  pendingRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  pendingWho: {
    flex: 1,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },
  fulfillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  sectionLabel: {
    marginTop: 20,
    marginBottom: 12,
  },

  showSkel: {
    gap: 12,
  },
  showCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    marginBottom: 12,
    overflow: 'hidden',
  },
  showCardOpen: {
    borderColor: colors.borderHot,
  },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  showIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMain: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  showRight: {
    alignItems: 'flex-end',
    gap: 6,
  },

  showDetail: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 14,
  },
  analyticsSkel: {
    gap: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricTile: {
    width: '47%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 10,
    gap: 6,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontFamily: fontFamily.extrabold,
  },
  metricBar: {
    marginVertical: 2,
  },
});

export default BroadcastHistoryScreen;
