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
  SegmentedControl,
  Skeleton,
} from '@components/shared';
import { Text } from '@components/ui';
import {
  useGroupCallAnalytics,
  useGroupCallHistory,
  useGroupCallHistorySummary,
} from '@hooks/useGroupCallHistory';
import { colors, fontFamily, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { duration, grouped, shortDateTime } from '@utils/format';
import { rf } from '@utils/responsive';

import type { GroupCallHistoryFilter, GroupCallHistoryItem } from '@app-types/api';

const FILTER_LABELS = ['All', 'Ended', 'Cancelled'] as const;
const LABEL_TO_FILTER: Record<(typeof FILTER_LABELS)[number], GroupCallHistoryFilter> = {
  All: 'all',
  Ended: 'ended',
  Cancelled: 'cancelled',
};
const FILTER_TO_LABEL: Record<GroupCallHistoryFilter, (typeof FILTER_LABELS)[number]> = {
  all: 'All',
  ended: 'Ended',
  cancelled: 'Cancelled',
};

const statusTone = (status: string): { bg: string; text: keyof typeof colors } => {
  if (status === 'ended') return { bg: colors.successChip, text: 'green' };
  if (status === 'cancelled' || status === 'failed') return { bg: colors.redSoft, text: 'danger' };
  if (status === 'terminated') return { bg: colors.warningChip, text: 'gold' };
  return { bg: colors.surfaceSoft, text: 'textMuted' };
};

/** Past group calls — filterable, with lifetime totals and per-call revenue breakdown. */
const GroupCallHistoryScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<GroupCallHistoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: history,
    isLoading: loadingHistory,
    isError: historyError,
    error: historyErrorObj,
    refetch: refetchHistory,
    isRefetching,
  } = useGroupCallHistory(filter);
  const { data: summary, isLoading: loadingSummary } = useGroupCallHistorySummary(filter);
  const { data: analytics, isLoading: loadingAnalytics } = useGroupCallAnalytics(expandedId);

  const toggleExpand = (groupCallId: string) =>
    setExpandedId((current) => (current === groupCallId ? null : groupCallId));

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
      header={
        <PageHeader
          title="Group Call History"
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/calls/schedule-session')}
              style={styles.newBtn}
              accessibilityRole="button"
              accessibilityLabel="Schedule a new session"
            >
              <Text variant="bodySm" color="white" style={styles.newLabel}>
                + New
              </Text>
            </Pressable>
          }
        />
      }
    >
      <View style={styles.callout}>
        <InfoCallout icon="info" tone="info">
          The full ledger of your past group sessions, newest first. Tap any call to see the
          participant requests, approvals, refunds, and exactly which revenue stream — entry,
          highlighted, rewards, or fun wheel — contributed to its earnings.
        </InfoCallout>
      </View>

      <SegmentedControl
        style={styles.filters}
        options={FILTER_LABELS}
        value={FILTER_TO_LABEL[filter]}
        onChange={(label) => setFilter(LABEL_TO_FILTER[label as (typeof FILTER_LABELS)[number]])}
      />

      {loadingSummary ? (
        <View style={styles.statRow}>
          <Skeleton height={74} round={radius.card} style={styles.statSkel} />
          <Skeleton height={74} round={radius.card} style={styles.statSkel} />
          <Skeleton height={74} round={radius.card} style={styles.statSkel} />
        </View>
      ) : (
        <View style={styles.statRow}>
          <StatCell icon="video" tint={colors.cyan} label="Calls" value={String(summary?.totalCalls ?? 0)} />
          <StatCell
            icon="dollar-sign"
            tint={colors.gold}
            label="Earned"
            value={`${grouped(summary?.totalRevenueTokens ?? 0)} tk`}
          />
          <StatCell icon="clock" tint={colors.green} label="Avg length" value={summaryAvgLength} />
        </View>
      )}

      <SectionLabel divider style={styles.sectionLabel}>
        PAST CALLS
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
          icon="users"
          title="No group calls yet"
          description={filter === 'all' ? 'Past group calls will show up here.' : 'No group calls match this filter.'}
        />
      ) : (
        history.map((item: GroupCallHistoryItem) => {
          const isExpanded = expandedId === item.groupCallId;
          const tone = statusTone(item.status);
          return (
            <View key={item.groupCallId} style={[styles.showCard, isExpanded ? styles.showCardOpen : null]}>
              <Pressable
                style={styles.showRow}
                onPress={() => toggleExpand(item.groupCallId)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${isExpanded ? 'hide' : 'show'} analytics`}
              >
                <View style={styles.showIcon}>
                  <Feather name="video" size={rf(16)} color={colors.cyan} />
                </View>
                <View style={styles.showMain}>
                  <View style={styles.titleRow}>
                    <Text variant="bodyLg" color="textPrimary" numberOfLines={1} style={[styles.strong, styles.titleText]}>
                      {item.title}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
                      <Text variant="label" color={tone.text}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                    {item.startedAtUtc ? shortDateTime(item.startedAtUtc) : 'Never started'} ·{' '}
                    {duration(item.durationSeconds ?? 0)}
                  </Text>
                </View>
                <View style={styles.showRight}>
                  <Text
                    variant="bodySm"
                    color={item.totalRevenueTokens > 0 ? 'green' : 'textMuted'}
                    style={styles.strong}
                  >
                    {item.totalRevenueTokens > 0 ? `+${grouped(item.totalRevenueTokens)} tk` : '0 tk'}
                  </Text>
                  <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={rf(14)} color={colors.textMuted} />
                </View>
              </Pressable>

              {isExpanded ? (
                <View style={styles.showDetail}>
                  {loadingAnalytics || !analytics || analytics.groupCallId !== item.groupCallId ? (
                    <View style={styles.analyticsSkel}>
                      <Skeleton height={70} round={radius.md} />
                      <Skeleton height={90} round={radius.md} />
                    </View>
                  ) : (
                    <>
                      <View style={styles.metricGrid}>
                        <MetricChip label="Peak participants" value={grouped(analytics.peakParticipantCount)} />
                        <MetricChip label="Total requests" value={grouped(analytics.totalRequests)} />
                        <MetricChip label="Approved" value={grouped(analytics.totalApproved)} tint="green" />
                        <MetricChip
                          label="Rejected"
                          value={grouped(analytics.totalRejected)}
                          tint={analytics.totalRejected > 0 ? 'gold' : undefined}
                        />
                        <MetricChip
                          label="Refunds"
                          value={`${grouped(analytics.refundCount)} (${grouped(analytics.refundedTokens)} tk)`}
                          tint={analytics.refundCount > 0 ? 'gold' : undefined}
                        />
                        <MetricChip label="Net earnings" value={`${grouped(analytics.netArtistEarningTokens)} tk`} tint="green" />
                      </View>

                      {(analytics.totalRejected > 0 || analytics.refundCount > 0) ? (
                        <InfoCallout tone="warning">
                          If a request is rejected or the call is cancelled, that participant is
                          refunded — only approved, completed activity counts toward net earnings.
                        </InfoCallout>
                      ) : null}

                      <View style={styles.breakdown}>
                        <Text variant="label" color="textMuted" style={styles.breakdownHead}>
                          REVENUE BREAKDOWN
                        </Text>
                        {[
                          { label: 'Highlighted', value: analytics.highlightedMessageRevenueTokens },
                          { label: 'Rewards', value: analytics.rewardRevenueTokens },
                          { label: 'Fun wheel', value: analytics.funWheelRevenueTokens },
                        ].map((row) => {
                          const pct =
                            analytics.totalRevenueTokens > 0
                              ? Math.round((row.value / analytics.totalRevenueTokens) * 100)
                              : 0;
                          return (
                            <View key={row.label} style={styles.bdRow}>
                              <Text variant="bodySm" color="textMuted" style={styles.bdLabel}>
                                {row.label}
                              </Text>
                              <ProgressBar value={pct / 100} height={5} style={styles.bdBar} />
                              <Text variant="bodySm" color="textPrimary" style={styles.bdAmt}>
                                {grouped(row.value)} tk
                              </Text>
                            </View>
                          );
                        })}
                        <View style={styles.bdTotal}>
                          <Feather name="dollar-sign" size={rf(13)} color={colors.gold} />
                          <Text variant="bodySm" color="textPrimary" style={styles.strong}>
                            Total
                          </Text>
                          <Text variant="bodySm" color="gold" style={[styles.strong, styles.bdTotalAmt]}>
                            {grouped(analytics.totalRevenueTokens)} tokens
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  {item.endReason ? (
                    <Text variant="bodySm" color="textMuted" style={styles.endReason}>
                      Ended: {item.endReason}
                    </Text>
                  ) : null}
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
    <Text variant="bodySm" color="textMuted" numberOfLines={1}>
      {label}
    </Text>
    <Text variant="h3" style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const MetricChip = ({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint?: keyof typeof colors;
}) => (
  <View style={styles.metricChip}>
    <Text variant="bodySm" color="textMuted" numberOfLines={1}>
      {label}
    </Text>
    <Text variant="bodyLg" color={tint ?? 'textPrimary'} style={styles.strong}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  newBtn: {
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newLabel: {
    fontFamily: fontFamily.bold,
  },

  callout: {
    marginTop: 12,
  },

  filters: {
    marginTop: 16,
  },

  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statSkel: {
    flex: 1,
  },
  statCell: {
    flex: 1,
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 12,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fontFamily.extrabold,
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
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMain: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    flex: 1,
  },
  statusChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  showRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },

  showDetail: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 14,
    gap: 12,
  },
  analyticsSkel: {
    gap: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricChip: {
    width: '47%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 10,
    gap: 4,
  },
  gcalloutInner: {
    marginTop: 0,
  },

  breakdown: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  breakdownHead: {
    marginBottom: 2,
  },
  bdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bdLabel: {
    width: 80,
  },
  bdBar: {
    flex: 1,
  },
  bdAmt: {
    width: 70,
    textAlign: 'right',
  },
  bdTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 10,
    marginTop: 2,
  },
  bdTotalAmt: {
    marginLeft: 'auto',
  },
  endReason: {
    fontStyle: 'italic',
  },
});

export default GroupCallHistoryScreen;
