import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  LearnLink,
  ListHead,
  SummaryCell,
  SummaryStrip,
  WebCallout,
} from '@components/history';
import { LoadFailed, PageHeader, Screen, Skeleton } from '@components/shared';
import { Text } from '@components/ui';
import { BroadcastRow } from '@screens/calls/broadcastHistory/components/BroadcastRow';
import { ListSkeleton } from '@screens/calls/broadcastHistory/components/ListSkeleton';
import { PendingRewardsCard } from '@screens/calls/broadcastHistory/components/PendingRewardsCard';
import { PAGE_SIZE } from '@screens/calls/broadcastHistory/format';
import { useBroadcastHistory } from '@screens/calls/broadcastHistory/useBroadcastHistory';
import { colors, fontFamily, layout, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, webDuration } from '@utils/format';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

import type { BroadcastHistoryItem } from '@app-types/api';

/**
 * Solo broadcast history — a replica of the Artist Web's
 * `CreatorBroadcastHistoryScreen` at phone widths. Same three reads the web
 * makes (history page, DB-aggregated lifetime summary, pending reward orders)
 * plus per-show analytics fetched only when a row is expanded.
 */
const BroadcastHistoryScreen = () => {
  const router = useRouter();

  const {
    expandedId,
    fulfillingId,
    history,
    loadingHistory,
    historyError,
    historyErrorObj,
    refetchHistory,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadingSummary,
    summary,
    pendingOrders,
    hasPending,
    analytics,
    loadingAnalytics,
    toggleAnalytics,
    handleFulfill,
  } = useBroadcastHistory(PAGE_SIZE);

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
            value={`${grouped(summary?.totalRevenueTokens ?? 0)} coins`}
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

      {hasPending && pendingOrders ? (
        <PendingRewardsCard
          pendingOrders={pendingOrders}
          fulfillingId={fulfillingId}
          onFulfill={(order) => void handleFulfill(order)}
        />
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
            history.map((item: BroadcastHistoryItem) => (
              <BroadcastRow
                key={item.broadcastId}
                item={item}
                isOpen={expandedId === item.broadcastId}
                analytics={analytics}
                loadingAnalytics={loadingAnalytics}
                onToggle={toggleAnalytics}
              />
            ))
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

  /* skeleton (loading-summary strip) --------------------------------------- */
  skelStrip: {
    flexDirection: 'row',
    gap: 12,
  },
  skelCell: {
    flex: 1,
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
});

export default BroadcastHistoryScreen;
