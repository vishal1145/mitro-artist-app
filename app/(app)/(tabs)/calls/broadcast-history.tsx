import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  CardDetail,
  HelpIcon,
  HistoryCard,
  LearnLink,
  ListHead,
  MetricGrid,
  MetricTile,
  SummaryCell,
  SummaryStrip,
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
import {
  colors,
  fontFamily,
  gradientDirection,
  layout,
  palette,
  webColors,
  webGradients,
} from '@theme';
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
      caption: `${grouped(a.highlightedMessageTokens)} tk`,
    },
    {
      key: 'rewards',
      hint: "Shoutouts, song requests, and other rewards fans purchased during this broadcast, plus the coins earned.",
      icon: 'check',
      color: webColors.purple,
      label: 'Reward orders',
      value: grouped(a.rewardOrderCount),
      barPct: tokenBar(a.rewardOrderTokens),
      caption: `${grouped(a.rewardOrderTokens)} tk`,
    },
    {
      key: 'funwheel',
      hint: "How many times viewers paid to spin the fun wheel during this broadcast, plus the coins earned.",
      icon: 'clock-3',
      color: webColors.cyan,
      label: 'Fun-wheel spins',
      value: grouped(a.funWheelSpinCount),
      barPct: tokenBar(a.funWheelSpinTokens),
      caption: `${grouped(a.funWheelSpinTokens)} tk`,
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
      header={<PageHeader title="Broadcast History" onBack={() => router.back()} />}
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

      {loadingSummary ? (
        <View style={[styles.skelStrip, styles.stripMargin]}>
          <Skeleton height={70} round={14} style={styles.skelCell} />
          <Skeleton height={70} round={14} style={styles.skelCell} />
        </View>
      ) : (
        <SummaryStrip style={styles.stripMargin}>
          <SummaryCell
            icon="radio"
            tint="cyan"
            label="Shows"
            hint="Total number of solo broadcasts you've hosted and ended, all-time."
            value={grouped(summary?.totalShows ?? 0)}
          />
          <SummaryCell
            icon="coins"
            tint="gold"
            label="Total earned"
            hint="Combined coins earned across every broadcast below — chat highlights, reactions, reward orders, and fun-wheel spins."
            value={`${grouped(summary?.totalRevenueTokens ?? 0)} tk`}
          />
          <SummaryCell
            icon="user-round"
            tint="purple"
            label="Unique viewers"
            hint="Sum of unique viewers across all your broadcasts. The same fan watching two different shows counts twice here."
            value={grouped(summary?.totalUniqueViewers ?? 0)}
          />
          <SummaryCell
            icon="clock-3"
            tint="green"
            label="Avg length"
            hint="Average duration of your broadcasts, from when you went live to when the show ended."
            value={webDuration(summary?.avgDurationSeconds ?? null)}
          />
        </SummaryStrip>
      )}

      {hasPending ? (
        <>
          <WebCallout tone="gold">
            <CalloutText>
              <CalloutStrong>Fulfill rewards promptly</CalloutStrong> — fans notice when a shoutout
              or song request never arrives, and that erodes trust fast. Quick delivery keeps fans
              confident enough to tip and book again on your next broadcast.
            </CalloutText>
          </WebCallout>

          <LinearGradient
            colors={webGradients.rewardsCard}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={styles.rewardsCard}
          >
            <View style={styles.rewardsEyebrow}>
              <LucideIcon name="check" size={rf(12)} color={webColors.gold} />
              <Text style={styles.rewardsEyebrowText}>To fulfill</Text>
            </View>
            <Text style={styles.rewardsHeading}>Pending Reward Deliveries</Text>

            <View style={styles.pendingList}>
              {pendingOrders.map((order) => (
                <View key={order.id} style={styles.pendingRow}>
                  <Text style={styles.pendingWho}>
                    <Text style={styles.pendingName}>{order.rewardName}</Text> for{' '}
                    {order.buyerDisplayName} ·{' '}
                    <Text style={styles.pendingAmt}>{grouped(order.priceCharged)} tk</Text>
                  </Text>
                  <Pressable
                    style={styles.btnGhost}
                    onPress={() => void handleFulfill(order)}
                    disabled={fulfillingId === order.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${order.rewardName} fulfilled`}
                  >
                    <LucideIcon name="check" size={rf(12)} color={webColors.green} />
                    <Text style={styles.btnGhostText}>
                      {fulfillingId === order.id ? 'Marking…' : 'Mark fulfilled'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </LinearGradient>
        </>
      ) : null}

      <View>
        <ListHead eyebrow="Past shows" heading="Broadcast History" />

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
            history.map((item: BroadcastHistoryItem) => {
              const isOpen = expandedId === item.broadcastId;
              const hasEarnings = item.totalRevenueTokens > 0;
              return (
                <HistoryCard key={item.broadcastId}>
                  <View style={styles.showRow}>
                    <View style={styles.showIcon}>
                      <LucideIcon name="radio" size={rf(18)} color={webColors.green} />
                    </View>

                    <Pressable
                      style={styles.showMain}
                      onPress={() => toggleAnalytics(item.broadcastId)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title}, ${isOpen ? 'hide' : 'show'} analytics`}
                    >
                      <Text numberOfLines={1} style={styles.showTitle}>
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
                            colors={webGradients.activePill}
                            start={gradientDirection.diagonal.start}
                            end={gradientDirection.diagonal.end}
                            style={StyleSheet.absoluteFill}
                          />
                        ) : null}
                        <LucideIcon
                          name="bar-chart-3"
                          size={rf(12)}
                          color={isOpen ? palette.white : webColors.muted}
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
                </HistoryCard>
              );
            })
          )}

          {/* Older shows land here on their own as the artist reaches the
              bottom — same auto-load the Transactions ledger uses. */}
          {isFetchingNextPage ? (
            <View style={styles.loadMore}>
              <ActivityIndicator size="small" color={webColors.pinkHot} />
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
    gap: 20,
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

  /** `.bcast-history-page .summary-strip { margin: 16px 0 }`. */
  stripMargin: {
    marginVertical: 16,
  },

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

  /* rewards-card ---------------------------------------------------------- */
  rewardsCard: {
    borderColor: webColors.panelBorder,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rewardsEyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderColor: webColors.goldCalloutBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardsEyebrowText: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.5),
    letterSpacing: 0.53,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  rewardsHeading: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(16),
    lineHeight: rf(21),
    marginBottom: 12,
  },

  pendingList: {
    gap: 8,
  },
  pendingRow: {
    alignItems: 'center',
    backgroundColor: webColors.innerCard,
    borderColor: webColors.hairline06,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  pendingWho: {
    color: webColors.muted,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.6),
    lineHeight: rf(18),
  },
  pendingName: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
  },
  pendingAmt: {
    color: webColors.gold,
    fontFamily: fontFamily.semibold,
  },
  btnGhost: {
    alignItems: 'center',
    borderColor: webColors.greenGhostBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  btnGhostText: {
    color: webColors.green,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
  rewardsEmpty: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(20),
    paddingVertical: 10,
    textAlign: 'center',
  },

  /* show list ------------------------------------------------------------- */
  showList: {
    gap: 10,
  },
  showRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  showIcon: {
    alignItems: 'center',
    backgroundColor: webColors.greenPill,
    borderColor: webColors.greenChipBorder,
    borderRadius: 11,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  showMain: {
    flex: 1,
    minWidth: 0,
  },
  showTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
    marginBottom: 2,
  },
  showMeta: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
  showRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  /** `.show-earn { display: inline-flex; align-items: center; gap: 3px }`. */
  showEarnRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  showEarn: {
    color: webColors.green,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  showEarnZero: {
    color: webColors.dim,
    fontFamily: fontFamily.medium,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  analyticsBtn: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  analyticsBtnOn: {
    alignItems: 'center',
    borderColor: palette.transparent,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  analyticsText: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
  analyticsTextOn: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },
});

export default BroadcastHistoryScreen;
