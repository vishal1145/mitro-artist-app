import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import {
  BreakdownRow,
  CalloutStrong,
  CalloutText,
  CardDetail,
  FilterPills,
  HelpIcon,
  LearnLink,
  ListHead,
  MetricChip,
  MetricGrid,
  SummaryCell,
  SummaryStrip,
  WebCallout,
  WebEmptyState,
} from '@components/history';
import { LoadFailed, PageHeader, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import {
  useGroupCallAnalytics,
  useGroupCallHistoryPaged,
  useGroupCallHistorySummary,
} from '@hooks/useGroupCallHistory';
import { colors, fontFamily, fontSize, layout, letterSpacing, lineHeight, radius, spacing, typography, webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, webDateTime, webDuration } from '@utils/format';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

import type { GroupCallHistoryFilter, GroupCallHistoryItem } from '@app-types/api';

/** `PAGE_SIZE` on the web's `GroupCallHistoryScreen`. */
const PAGE_SIZE = 20;

/** `.filter-pills` — the web's three buttons, in its order. */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ended', label: 'Ended' },
  { key: 'cancelled', label: 'Cancelled' },
] as const satisfies readonly { key: GroupCallHistoryFilter; label: string }[];

/** `statusChipClass()` — anything unrecognised falls back to the `ended` chip. */
const statusChip = (status: string) => {
  if (status === 'cancelled' || status === 'failed') {
    return chipStyles.cancelled;
  }
  if (status === 'terminated') {
    return chipStyles.terminated;
  }
  return chipStyles.ended;
};

/** Groups calls by local calendar day (list is already newest first). */
const groupByDay = (items: GroupCallHistoryItem[]) => {
  const groups: { key: string; label: string; items: GroupCallHistoryItem[] }[] = [];
  const today = new Date().toDateString();
  items.forEach((item) => {
    const d = item.startedAtUtc ? new Date(item.startedAtUtc) : null;
    const key = d ? d.toDateString() : 'unknown';
    const label = !d
      ? 'NEVER STARTED'
      : key === today
        ? 'TODAY'
        : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label, items: [item] });
  });
  return groups;
};

/** Ring colour per status — ended green, terminated gold, cancelled/failed red. */
const statusDot = (status: string) =>
  status === 'cancelled' || status === 'failed'
    ? colors.error
    : status === 'terminated'
      ? colors.warning
      : colors.success;

/** `GcallSummaryStripSkeleton` + `GcallHistorySkeleton`, in the app's shimmer. */
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

/** `GcallAnalyticsSkeleton` — six chips over the breakdown rows. */
const AnalyticsSkeleton = () => (
  <View style={styles.skelAnalytics}>
    <View style={styles.skelChips}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} height={58} round={12} style={styles.skelChip} />
      ))}
    </View>
    <Skeleton height={20} round={6} />
    <Skeleton height={20} round={6} />
    <Skeleton height={20} round={6} />
    <Skeleton height={30} round={8} />
  </View>
);

/**
 * Past group calls — a replica of the Artist Web's `GroupCallHistoryScreen`
 * at phone widths. Data comes from the same three endpoints the web calls:
 * history (status-filtered, server-side), the DB-aggregated lifetime summary,
 * and per-call analytics fetched only once a row is expanded.
 */
const GroupCallHistoryScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<GroupCallHistoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  } = useGroupCallHistoryPaged(filter, PAGE_SIZE);
  /** Every page walked so far, flattened into the single list the UI renders. */
  const history = useMemo(() => historyPages?.pages.flat() ?? [], [historyPages]);
  const { data: summary, isLoading: loadingSummary } = useGroupCallHistorySummary(filter);
  const { data: analytics, isLoading: loadingAnalytics } = useGroupCallAnalytics(expandedId);

  const toggleExpand = (groupCallId: string) =>
    setExpandedId((current) => (current === groupCallId ? null : groupCallId));

  const isLoading = loadingHistory || loadingSummary;
  const isEmpty = !history || history.length === 0;

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
          <WebCallout plain>
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

          <SummaryStrip plain>
            <SummaryCell
              plain
              icon="video"
              tint="cyan"
              label="Calls"
              value={grouped(summary?.totalCalls ?? 0)}
              hint="Total number of group call sessions you've created, across every status (ended, cancelled, etc.)."

            />
            <SummaryCell
              plain
              icon="coins"
              tint="gold"
              label="Total earned"
              value={`${grouped(summary?.totalRevenueTokens ?? 0)} coins`}
              hint="Sum of the total revenue coins across all your past group calls."

            />
            <SummaryCell
              plain
              icon="clock-3"
              tint="green"
              label="Avg length"
              value={webDuration(summary?.avgDurationSeconds ?? null)}
              hint="Average duration of your past group calls, from start to end."

            />
          </SummaryStrip>

          <View style={styles.histSection}>
            <ListHead eyebrow="Past shows" heading="Group Call History" />

            <View style={styles.callList}>
              {groupByDay(history).map((group) => (
                <View key={group.key}>
                  <Text style={styles.dayLabel}>{group.label}</Text>
                  {group.items.map((item: GroupCallHistoryItem, i) => {
                    const isOpen = expandedId === item.groupCallId;
                    const hasEarnings = item.totalRevenueTokens > 0;
                    const first = i === 0;
                    const last = i === group.items.length - 1;
                    return (
                      <View key={item.groupCallId} style={styles.tlRow}>
                        <View style={styles.tlRail} pointerEvents="none">
                          <View style={[styles.tlLine, first ? styles.tlLineFirst : null, last ? styles.tlLineLast : null, first && last ? styles.tlLineOnly : null]} />
                          <View style={[styles.tlDot, { borderColor: statusDot(item.status) }]} />
                        </View>
                        <View style={styles.tlBody}>
                          <Pressable
                            style={styles.tlContent}
                            onPress={() => toggleExpand(item.groupCallId)}
                            accessibilityRole="button"
                            accessibilityState={{ expanded: isOpen }}
                            accessibilityLabel={`${item.title}, ${isOpen ? 'collapse' : 'expand'} details`}
                          >
                            <View style={styles.callMain}>
                              <View style={styles.callTitleRow}>
                                <Text numberOfLines={1} style={styles.callTitle}>
                                  {item.title}
                                </Text>
                                <View style={statusChip(item.status)}>
                                  <Text style={statusChipInk(item.status)}>{item.status}</Text>
                                </View>
                              </View>
                              <Text style={styles.callMeta}>
                                {item.startedAtUtc ? webDateTime(item.startedAtUtc) : 'never started'}
                                {' · '}
                                {webDuration(item.durationSeconds)}
                              </Text>
                            </View>

                            <View style={styles.callRight}>
                              <Text style={hasEarnings ? styles.callEarn : styles.callEarnZero}>
                                {hasEarnings ? `+${grouped(item.totalRevenueTokens)} coins` : '0 coins'}
                              </Text>
                              <HelpIcon
                                hint={`You earned ${grouped(item.totalRevenueTokens)} coins for this call based on duration (${webDuration(item.durationSeconds)}) and peak participants (${grouped(item.peakParticipantCount)}).`}
                              />
                              <View style={isOpen ? styles.chevOpen : undefined}>
                                <LucideIcon
                                  name="chevron-down"
                                  size={rf(16)}
                                  color={isOpen ? webColors.textStrong : webColors.dim}
                                />
                              </View>
                            </View>
                          </Pressable>

                    {isOpen ? (
                      <CardDetail>
                        {loadingAnalytics ||
                        !analytics ||
                        analytics.groupCallId !== item.groupCallId ? (
                          <AnalyticsSkeleton />
                        ) : (
                          <>
                            <MetricGrid>
                              <MetricChip
                                label="Peak participants"
                                hint="The highest number of participants in the room at the same time during this call."
                                value={grouped(analytics.peakParticipantCount)}
                              />
                              <MetricChip
                                label="Total requests"
                                hint="Total number of fans who requested to join this call."
                                value={grouped(analytics.totalRequests)}
                              />
                              <MetricChip
                                label="Approved"
                                hint="Requests you approved, letting the fan into the call."
                                value={grouped(analytics.totalApproved)}
                                tone="good"
                              />
                              <MetricChip
                                label="Rejected"
                                hint="Requests you rejected — that fan was refunded automatically."
                                value={grouped(analytics.totalRejected)}
                                tone={analytics.totalRejected > 0 ? 'warn' : undefined}
                              />
                              <MetricChip
                                label="Refunds"
                                hint="Refunds issued for this call (rejected requests or early cancellations), and the coins refunded."
                                value={`${grouped(analytics.refundCount)} (${grouped(analytics.refundedTokens)} coins)`}
                                tone={analytics.refundCount > 0 ? 'warn' : undefined}
                              />
                              <MetricChip
                                label="Net earnings"
                                hint="What you actually earned from this call after refunds — only approved, completed activity counts."
                                value={`${grouped(analytics.netArtistEarningTokens)} coins`}
                                tone="good"
                              />
                            </MetricGrid>

                            <View style={styles.detailCallout}>
                              <WebCallout plain tone="gold">
                                <CalloutText>
                                  If a request is rejected or the call is cancelled, that
                                  participant is refunded — only{' '}
                                  <CalloutStrong>approved, completed</CalloutStrong> activity
                                  counts toward net earnings.
                                </CalloutText>
                              </WebCallout>
                            </View>

                            <View style={styles.breakdown}>
                              <Text style={styles.breakdownHead}>Revenue breakdown</Text>
                              {(
                                [
                                  {
                                    label: 'Highlighted',
                                    value: analytics.highlightedMessageRevenueTokens,
                                    hint: 'Coins fans paid to highlight/pin their chat message during the call.',
                                  },
                                  {
                                    label: 'Rewards',
                                    value: analytics.rewardRevenueTokens,
                                    hint: 'Coins fans spent sending you rewards/gifts during the call.',
                                  },
                                  {
                                    label: 'Fun wheel',
                                    value: analytics.funWheelRevenueTokens,
                                    hint: 'Coins fans spent spinning the Fun Wheel during the call.',
                                  },
                                ] as const
                              ).map((row) => (
                                <BreakdownRow
                                  key={row.label}
                                  label={row.label}
                                  hint={row.hint}
                                  amount={`${grouped(row.value)} coins`}
                                  pct={
                                    analytics.totalRevenueTokens > 0
                                      ? (row.value / analytics.totalRevenueTokens) * 100
                                      : 0
                                  }
                                />
                              ))}
                              <View style={styles.bdTotal}>
                                <LucideIcon name="coins" size={rf(15)} color={webColors.gold} />
                                <Text style={styles.bdTotalLabel}>Total</Text>
                                <Text style={styles.bdTotalAmt}>
                                  {grouped(analytics.totalRevenueTokens)} coins
                                </Text>
                              </View>
                            </View>
                          </>
                        )}

                        {item.endReason ? (
                          <Text style={styles.gcallNote}>Ended: {item.endReason}</Text>
                        ) : null}
                      </CardDetail>
                    ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
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

/** `.status-chip.{ended,cancelled,terminated}` fills. */
const chipStyles = StyleSheet.create({
  ended: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.neutralChip,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cancelled: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.redChip,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  terminated: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

/** The matching chip ink — `--premium-muted` / `#ff8a97` / `--premium-gold`. */
const chipInk = StyleSheet.create({
  ended: {
    color: webColors.muted,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    lineHeight: lineHeight.mono,
    textTransform: 'uppercase',
  },
  cancelled: {
    color: webColors.redInk,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    lineHeight: lineHeight.mono,
    textTransform: 'uppercase',
  },
  terminated: {
    color: webColors.gold,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    lineHeight: lineHeight.mono,
    textTransform: 'uppercase',
  },
});

const statusChipInk = (status: string) => {
  if (status === 'cancelled' || status === 'failed') {
    return chipInk.cancelled;
  }
  if (status === 'terminated') {
    return chipInk.terminated;
  }
  return chipInk.ended;
};

const styles = StyleSheet.create({
  /* --- History timeline (divider on top, no card boxes) --- */
  histSection: { marginTop: spacing.xs, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  dayLabel: { ...typography.label, color: colors.textMuted, paddingVertical: spacing.sm, paddingLeft: spacing.lg + spacing.xs },
  tlRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  tlRail: { width: 20, alignSelf: 'stretch', alignItems: 'center' },
  tlLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.borderStrong },
  tlLineFirst: { top: spacing.sm + 9 },
  tlLineLast: { bottom: undefined, height: spacing.sm + 9 },
  tlLineOnly: { display: 'none' },
  tlDot: { marginTop: spacing.sm + 2, width: 14, height: 14, borderRadius: radius.pill, borderWidth: 2, backgroundColor: colors.background },
  tlBody: { flex: 1, minWidth: 0 },
  tlContent: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
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

  /* skeletons ------------------------------------------------------------- */
  skelStrip: {
    flexDirection: 'row',
    gap: 12,
  },
  skelCell: {
    flex: 1,
  },
  skelList: {
    gap: 16,
  },
  skelAnalytics: {
    gap: 10,
    paddingTop: 14,
  },
  skelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  skelChip: {
    flexBasis: '47%',
    flexGrow: 1,
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
  callRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  callIcon: {
    alignItems: 'center',
    backgroundColor: webColors.purpleChip,
    borderColor: webColors.purpleChipBorder,
    borderRadius: 11,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  callMain: {
    flex: 1,
    minWidth: 0,
  },
  callTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
    minWidth: 0,
  },
  callTitle: {
    color: webColors.textStrong,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  callMeta: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
  },
  callRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  callEarn: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  callEarnZero: {
    color: webColors.dim,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  chevOpen: {
    transform: [{ rotate: '180deg' }],
  },

  /* detail ---------------------------------------------------------------- */
  detailCallout: {
    marginTop: 16,
  },
  breakdown: {
    marginTop: 16,
  },
  breakdownHead: {
    color: webColors.dim,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    lineHeight: lineHeight.mono,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  bdTotal: {
    alignItems: 'center',
    borderTopColor: webColors.hairline06,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
  },
  bdTotalLabel: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  bdTotalAmt: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    marginLeft: 'auto',
  },
  gcallNote: {
    color: webColors.textSoft,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    marginTop: 12,
  },
});

export default GroupCallHistoryScreen;
