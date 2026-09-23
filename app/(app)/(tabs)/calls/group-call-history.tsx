import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  FilterPills,
  LearnLink,
  ListHead,
  SummaryCell,
  SummaryStrip,
  WebCallout,
  WebEmptyState,
} from '@components/history';
import { LoadFailed, PageHeader, Screen } from '@components/shared';
import { GroupCallRow } from '@screens/calls/groupCallHistory/components/GroupCallRow';
import { ListSkeleton } from '@screens/calls/groupCallHistory/components/ListSkeleton';
import { FILTERS, PAGE_SIZE } from '@screens/calls/groupCallHistory/format';
import { useGroupCallHistory } from '@screens/calls/groupCallHistory/useGroupCallHistory';
import { colors, layout, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, webDuration } from '@utils/format';
import { showToast } from '@utils/toast';

import type { GroupCallHistoryItem } from '@app-types/api';

/**
 * Past group calls — a replica of the Artist Web's `GroupCallHistoryScreen`
 * at phone widths. Data comes from the same three endpoints the web calls:
 * history (status-filtered, server-side), the DB-aggregated lifetime summary,
 * and per-call analytics fetched only once a row is expanded.
 */
const GroupCallHistoryScreen = () => {
  const router = useRouter();

  const {
    filter,
    setFilter,
    expandedId,
    history,
    historyError,
    historyErrorObj,
    refetchHistory,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    summary,
    analytics,
    loadingAnalytics,
    isLoading,
    isEmpty,
    toggleExpand,
  } = useGroupCallHistory(PAGE_SIZE);

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
      header={<PageHeader title="Group Call History" onBack={() => router.back()} />}
    >
      <FilterPills options={FILTERS} value={filter} onChange={setFilter} />

      {isLoading ? (
        <ListSkeleton />
      ) : historyError ? (
        <LoadFailed message={getErrorMessage(historyErrorObj)} onRetry={refetchHistory} />
      ) : isEmpty ? (
        <WebEmptyState
          icon="calendar-days"
          message={
            filter === 'all' ? 'No past group calls yet.' : 'No group calls match this filter.'
          }
        />
      ) : (
        <>
          <WebCallout>
            <CalloutText>
              This is the{' '}
              <CalloutStrong>full ledger of your past group sessions</CalloutStrong>, newest
              first. Tap any row to expand it and see the participant requests, approvals, and
              refunds for that call, plus exactly which <CalloutStrong>revenue stream</CalloutStrong>{' '}
              — Entry, Highlighted, Rewards, or Fun wheel — contributed to its earnings.{' '}
              <LearnLink
                label="Learn more about revenue streams"
                onPress={() =>
                  showToast(
                    "Revenue stream breakdown guide isn't part of this concept pass yet",
                    'info',
                  )
                }
              />
            </CalloutText>
          </WebCallout>

          <SummaryStrip>
            <SummaryCell
              icon="video"
              tint="cyan"
              label="Calls"
              value={grouped(summary?.totalCalls ?? 0)}
              hint="Total number of group call sessions you've created, across every status (ended, cancelled, etc.)."
            />
            <SummaryCell
              icon="coins"
              tint="gold"
              label="Total earned"
              value={`${grouped(summary?.totalRevenueTokens ?? 0)} coins`}
              hint="Sum of the total revenue coins across all your past group calls."
            />
            <SummaryCell
              icon="clock-3"
              tint="green"
              label="Avg length"
              value={webDuration(summary?.avgDurationSeconds ?? null)}
              hint="Average duration of your past group calls, from start to end."
            />
          </SummaryStrip>

          <View>
            <ListHead eyebrow="Past shows" heading="Group Call History" />

            <View style={styles.callList}>
              {history.map((item: GroupCallHistoryItem) => (
                <GroupCallRow
                  key={item.groupCallId}
                  item={item}
                  isOpen={expandedId === item.groupCallId}
                  analytics={analytics}
                  loadingAnalytics={loadingAnalytics}
                  onToggle={toggleExpand}
                />
              ))}

              {/* Older calls land here on their own as the artist reaches the
                  bottom — same auto-load the Transactions ledger uses. */}
              {isFetchingNextPage ? (
                <View style={styles.loadMore}>
                  <ActivityIndicator size="small" color={webColors.pinkHot} />
                </View>
              ) : null}
            </View>
          </View>
        </>
      )}
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

  /* call list ------------------------------------------------------------- */
  callList: {
    gap: 10,
  },
  /** Footer spinner while the next page of calls lands. */
  loadMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});

export default GroupCallHistoryScreen;
