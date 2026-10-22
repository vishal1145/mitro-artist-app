import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  CardDetail,
  HelpIcon,
  LearnLink,
  MetricGrid,
  MetricTile,
  WebCallout,
} from '@components/history';
import { LoadFailed, PageHeader, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import {
  useBroadcastAnalytics,
  useBroadcastHistoryPaged,
  useBroadcastHistorySummary,
} from '@hooks/useInsights';
import { useFulfillRewardOrderMutation, usePendingRewardOrders } from '@hooks/useRewardOrders';
import { colors, fontFamily, fontSize, gradientDirection, gradients, layout, lineHeight, radius, spacing, typography, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, webDateTime, webDuration } from '@utils/format';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

import type { BroadcastAnalytics, BroadcastHistoryItem, RewardOrder } from '@app-types/api';

/** `HISTORY_PAGE_SIZE` on the web's `CreatorBroadcastHistoryScreen`. */
const PAGE_SIZE = 20;

/** One `.metric-tile` — same five, same order, same icons and inks as the web. */
interface Tile {
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

const analyticsTiles = (a: BroadcastAnalytics): Tile[] => {
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

/** `SummaryStripSkeleton` + `BroadcastHistorySkeleton`. */
const ListSkeleton = () => (
  <>
    <View style={styles.skelStrip}>
      <Skeleton height={70} round={14} style={styles.skelCell} />
      <Skeleton height={70} round={14} style={styles.skelCell} />
    </View>
    <View style={styles.skelList}>
      <Skeleton height={68} round={14} />
      <Skeleton height={68} round={14} />
      <Skeleton height={68} round={14} />
    </View>
  </>
);

/** `AnalyticsSkeleton` — the tile grid that stands in while analytics load. */
const AnalyticsSkeleton = () => (
  <View style={styles.skelTiles}>
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} height={92} round={12} style={styles.skelTile} />
    ))}
  </View>
);

/**
 * Solo broadcast history — a replica of the Artist Web's
 * `CreatorBroadcastHistoryScreen` at phone widths. Same three reads the web
 * makes (history page, DB-aggregated lifetime summary, pending reward orders)
 * plus per-show analytics fetched only when a row is expanded.
 */
const BroadcastHistoryScreen = () => {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const {
    data: historyPages,
    isLoading: loadingHistory,
    isError: historyError,
    error: historyErrorObj,
    refetch: refetchHistory,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBroadcastHistoryPaged(PAGE_SIZE);
  /** Every page walked so far, flattened into the single list the UI renders. */
  const history = useMemo(() => historyPages?.pages.flat() ?? [], [historyPages]);
  const { data: summary, isLoading: loadingSummary } = useBroadcastHistorySummary();
  const { data: pendingOrders, isLoading: loadingOrders } = usePendingRewardOrders();
  const { data: analytics, isLoading: loadingAnalytics } = useBroadcastAnalytics(expandedId);
  const fulfillMutation = useFulfillRewardOrderMutation();

  const toggleAnalytics = (broadcastId: string) =>
    setExpandedId((current) => (current === broadcastId ? null : broadcastId));

  const handleFulfill = async (order: RewardOrder) => {
    setFulfillingId(order.id);
    try {
      const result = await fulfillMutation.mutateAsync(order.id);
      showToast(
        result.message ?? `Marked "${order.rewardName}" as delivered to ${order.buyerDisplayName}.`,
        'success',
      );
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setFulfillingId(null);
    }
  };

  const hasPending = !loadingOrders && !!pendingOrders && pendingOrders.length > 0;

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetchHistory()}
          tintColor={colors.pink}
        />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      }}
      header={
        <PageHeader
          title="Broadcast History"
          subtitle="Every past broadcast with peak viewers, revenue, and engagement — plus reward deliveries still owed."
          onBack={() => router.back()}
        />
      }
    >
      <WebCallout>
        <CalloutText>
          This is the full record of every <CalloutStrong>solo broadcast</CalloutStrong> you&apos;ve
          hosted, with <CalloutStrong>peak viewers</CalloutStrong> and{' '}
          <CalloutStrong>earnings</CalloutStrong> for each session at a glance. Tap{' '}
          <CalloutStrong>Analytics</CalloutStrong> on any show to expand it and see the breakdown of
          chat activity, reactions, reward orders, and fun-wheel spins that made up that
          session&apos;s total.{' '}
          <LearnLink
            label="Learn more about session analytics"
            onPress={() =>
              showToast("Session analytics export isn't part of this concept pass yet", 'info')
            }
          />
        </CalloutText>
      </WebCallout>

      {/* .summary-strip — hero numbers, no boxes, divider lines */}
      {loadingSummary ? (
        <View style={styles.skelStrip}>
          <Skeleton height={70} round={14} style={styles.skelCell} />
          <Skeleton height={70} round={14} style={styles.skelCell} />
        </View>
      ) : (
        <View style={styles.strip}>
          {[
            [
              { label: 'Shows', hint: "Total number of solo broadcasts you've hosted and ended, all-time.", value: grouped(summary?.totalShows ?? 0) },
              { label: 'Total earned', hint: 'Combined coins earned across every broadcast below — chat highlights, reactions, reward orders, and fun-wheel spins.', value: `${grouped(summary?.totalRevenueTokens ?? 0)} coins`, earn: true },
            ],
            [
              { label: 'Unique viewers', hint: 'Sum of unique viewers across all your broadcasts. The same fan watching two different shows counts twice here.', value: grouped(summary?.totalUniqueViewers ?? 0) },
              { label: 'Avg length', hint: 'Average duration of your broadcasts, from when you went live to when the show ended.', value: webDuration(summary?.avgDurationSeconds ?? null) },
            ],
          ].map((row, r) => (
            <View key={r} style={styles.stripRow}>
              {row.map((cell, c) => (
                <View key={cell.label} style={[styles.stripCell, c === 0 ? styles.stripCellFirst : null]}>
                  <View style={styles.stripLabelRow}>
                    <Text style={styles.stripLabel} numberOfLines={1}>{cell.label}</Text>
                    <HelpIcon hint={cell.hint} size={12} />
                  </View>
                  <Text style={[styles.stripValue, cell.earn ? styles.stripValueEarn : null]}>{cell.value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* .bh-section — pending reward deliveries */}
      {hasPending ? (
        <View style={styles.section}>
          <View>
            <View style={styles.sectionHeadRow}>
              <Text style={styles.sectionTitle}>Pending reward deliveries</Text>
              <View style={styles.countWarn}>
                <Text style={styles.countWarnText}>{pendingOrders.length}</Text>
              </View>
            </View>
            <Text style={styles.sectionSub}>
              Fans notice when a shoutout or song request never arrives. Quick delivery keeps them
              tipping and booking again.
            </Text>
          </View>

          <WebCallout tone="gold">
            <CalloutText>
              <CalloutStrong>Fulfill rewards promptly</CalloutStrong> — fans notice when a shoutout
              or song request never arrives, and that erodes trust fast. Quick delivery keeps fans
              confident enough to tip and book again on your next broadcast.
            </CalloutText>
          </WebCallout>

          <View style={styles.rewardsCard}>
            {pendingOrders.map((order, i) => (
              <View key={order.id} style={[styles.pendingRow, i < pendingOrders.length - 1 ? styles.pendingRowBorder : null]}>
                <Text style={styles.pendingWho}>
                  <Text style={styles.pendingName}>{order.rewardName}</Text> for{' '}
                  {order.buyerDisplayName} ·{' '}
                  <Text style={styles.pendingAmt}>{grouped(order.priceCharged)} coins</Text>
                </Text>
                <Pressable
                  style={styles.btnGhost}
                  onPress={() => void handleFulfill(order)}
                  disabled={fulfillingId === order.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${order.rewardName} fulfilled`}
                >
                  <LucideIcon name="check" size={rf(12)} color={colors.success} />
                  <Text style={styles.btnGhostText}>
                    {fulfillingId === order.id ? 'Marking…' : 'Mark fulfilled'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* .bh-section — past shows */}
      <View style={styles.section}>
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>Past shows</Text>
          {history && history.length > 0 ? (
            <View style={styles.count}>
              <Text style={styles.countText}>{history.length}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.showList}>
          {loadingHistory ? (
            <ListSkeleton />
          ) : historyError ? (
            <LoadFailed message={getErrorMessage(historyErrorObj)} onRetry={refetchHistory} />
          ) : !history || history.length === 0 ? (
            <Text style={styles.rewardsEmpty}>
              No ended broadcasts yet. They&apos;ll show up here once you end a live show.
            </Text>
          ) : (
            history.map((item: BroadcastHistoryItem, i) => {
              const isOpen = expandedId === item.broadcastId;
              const hasEarnings = item.totalRevenueTokens > 0;
              return (
                <View
                  key={item.broadcastId}
                  style={[
                    styles.showCard,
                    i < history.length - 1 ? styles.showCardBorder : null,
                    isOpen ? styles.showCardOpen : null,
                  ]}
                >
                  <View style={styles.showRow}>
                    <View style={styles.showIcon}>
                      <LucideIcon name="radio" size={rf(18)} color={colors.success} />
                    </View>

                    <Pressable
                      style={styles.showMain}
                      onPress={() => toggleAnalytics(item.broadcastId)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title}, ${isOpen ? 'hide' : 'show'} analytics`}
                    >
                      <Text numberOfLines={2} style={styles.showTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.showMeta}>
                        {item.startedAtUtc ? webDateTime(item.startedAtUtc) : 'Unknown start'}
                        {' · '}
                        {webDuration(item.durationSeconds)}
                        {' · Peak '}
                        {item.peakViewerCount} viewers ·{' '}
                        {item.totalUniqueViewers} total · {item.status}
                        {item.endReason ? ` (${item.endReason})` : ''}
                      </Text>
                    </Pressable>

                    <View style={styles.showRight}>
                      <View style={styles.showEarnRow}>
                        <Text style={hasEarnings ? styles.showEarn : styles.showEarnZero}>
                          {hasEarnings ? `+${grouped(item.totalRevenueTokens)}` : '0'}
                        </Text>
                        <HelpIcon
                          hint="Total coins this specific broadcast earned — chat highlights, reactions, reward orders, and fun-wheel spins combined."
                          size={11}
                        />
                      </View>
                      <Pressable
                        onPress={() => toggleAnalytics(item.broadcastId)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                        style={isOpen ? styles.analyticsBtnOn : styles.analyticsBtn}
                      >
                        {isOpen ? (
                          <LinearGradient
                            colors={gradients.cta}
                            start={gradientDirection.diagonal.start}
                            end={gradientDirection.diagonal.end}
                            style={StyleSheet.absoluteFill}
                          />
                        ) : null}
                        <LucideIcon
                          name="bar-chart-3"
                          size={rf(12)}
                          color={isOpen ? colors.white : colors.textMuted}
                        />
                        <Text style={isOpen ? styles.analyticsTextOn : styles.analyticsText}>
                          {isOpen ? 'Hide' : 'Analytics'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {isOpen ? (
                    <CardDetail>
                      {loadingAnalytics ||
                      !analytics ||
                      analytics.broadcastId !== item.broadcastId ? (
                        <AnalyticsSkeleton />
                      ) : (
                        <MetricGrid>
                          {analyticsTiles(analytics).map((tile) => (
                            <MetricTile
                              key={tile.key}
                              icon={tile.icon}
                              iconColor={tile.color}
                              label={tile.label}
                              value={tile.value}
                              barPct={tile.barPct}
                              caption={tile.caption}
                              hint={tile.hint}
                            />
                          ))}
                        </MetricGrid>
                      )}
                    </CardDetail>
                  ) : null}
                </View>
              );
            })
          )}

          {isFetchingNextPage ? (
            <View style={styles.loadMore}>
              <ActivityIndicator size="small" color={colors.pink} />
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  /* `.creator-main` is 12px at phone widths; `.creator-view` stacks at 20px. */
  content: {
    gap: spacing.xl,
    /* `Screen` leaves its header slot flush and expects the first element to
       supply the gap — without this the callout touched the page title. */
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: layout.screenPadding,
  },
  /** Footer spinner while the next page of shows lands. */
  loadMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: webColors.chip,
    borderColor: webColors.circleBorder,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    // `Screen` pads its header slot by `layout.screenPadding` (24); this page
    // runs at the web's 12px gutter, so pull the button back into line.
    marginLeft: 12 - layout.screenPadding,
    width: 40,
  },

  /* .summary-strip — no boxes, divider lines (web bhistory-v2.css) */
  strip: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.xs,
  },
  stripRow: { flexDirection: 'row' },
  stripCell: {
    borderLeftColor: colors.border,
    borderLeftWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stripCellFirst: { borderLeftWidth: 0, paddingLeft: 0 },
  stripLabelRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs, marginBottom: spacing.xxs },
  stripLabel: { ...typography.label, color: colors.textDim, flexShrink: 1 },
  stripValue: { ...typography.metric, color: colors.textPrimary },
  stripValueEarn: { color: colors.warning },

  /* .bh-section ------------------------------------------------------------ */
  section: { gap: spacing.sm },
  sectionHeadRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  sectionTitle: { ...typography.metric, color: colors.textPrimary },
  sectionSub: { ...typography.subtitle, color: colors.textMuted, marginTop: spacing.xxs },
  count: { backgroundColor: colors.surfaceHover, borderRadius: radius.pill, paddingHorizontal: spacing.xs },
  countText: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.textMuted },
  countWarn: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.xs },
  countWarnText: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.warning },

  /* skeletons ------------------------------------------------------------- */
  skelStrip: {
    flexDirection: 'row',
    gap: 12,
  },
  skelCell: {
    flex: 1,
  },
  skelList: {
    gap: 10,
  },
  skelTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 14,
  },
  skelTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },

  /* rewards-card — one flat list inside a warning-border box ---------------- */
  rewardsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.warningBorder,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  pendingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pendingRowBorder: { borderBottomColor: colors.borderSoft, borderBottomWidth: 1 },
  pendingWho: { ...typography.subtitle, color: colors.textMuted, flex: 1 },
  pendingName: { color: colors.textPrimary, fontFamily: fontFamily.bold },
  pendingAmt: { color: colors.warning },
  btnGhost: {
    alignItems: 'center',
    borderColor: colors.successBorder,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  btnGhostText: { ...typography.subtitle, color: colors.success },
  rewardsEmpty: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    paddingVertical: 10,
    textAlign: 'center',
  },

  /* show list — one box, flat rows split by hairlines ---------------------- */
  showList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  showCard: {},
  showCardBorder: { borderBottomColor: colors.borderSoft, borderBottomWidth: 1 },
  showCardOpen: { backgroundColor: colors.surfaceSoft },
  showRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  showIcon: {
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  showMain: { flex: 1, minWidth: 0 },
  showTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xxs },
  showMeta: { ...typography.bodySm, color: colors.textDim },
  showRight: { alignItems: 'flex-end', gap: spacing.xs },
  showEarnRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  showEarn: { ...typography.h3, color: colors.success },
  showEarnZero: { ...typography.h3, color: colors.textDim },
  analyticsBtn: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  analyticsBtnOn: {
    alignItems: 'center',
    borderColor: colors.transparent,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  analyticsText: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.textMuted },
  analyticsTextOn: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.white },
});

export default BroadcastHistoryScreen;
