import { StyleSheet, View } from 'react-native';

import { BreakdownRow, CalloutStrong, CalloutText, MetricChip, MetricGrid, WebCallout } from '@components/history';
import { LucideIcon, Text } from '@components/ui';
import type { GroupCallAnalytics, GroupCallHistoryItem } from '@app-types/api';
import { fontFamily, webColors } from '@theme';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import { revenueBreakdownRows } from '../format';

interface AnalyticsDetailProps {
  analytics: GroupCallAnalytics;
  item: GroupCallHistoryItem;
}

/** Expanded per-call breakdown — 6 `MetricChip`s + the revenue breakdown. */
export const AnalyticsDetail = ({ analytics, item }: AnalyticsDetailProps) => (
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
      <WebCallout tone="gold">
        <CalloutText>
          If a request is rejected or the call is cancelled, that participant is refunded — only{' '}
          <CalloutStrong>approved, completed</CalloutStrong> activity counts toward net earnings.
        </CalloutText>
      </WebCallout>
    </View>

    <View style={styles.breakdown}>
      <Text style={styles.breakdownHead}>Revenue breakdown</Text>
      {revenueBreakdownRows(analytics).map((row) => (
        <BreakdownRow key={row.label} label={row.label} hint={row.hint} amount={row.amount} pct={row.pct} />
      ))}
      <View style={styles.bdTotal}>
        <LucideIcon name="coins" size={rf(15)} color={webColors.gold} />
        <Text style={styles.bdTotalLabel}>Total</Text>
        <Text style={styles.bdTotalAmt}>{grouped(analytics.totalRevenueTokens)} coins</Text>
      </View>
    </View>

    {item.endReason ? <Text style={styles.gcallNote}>Ended: {item.endReason}</Text> : null}
  </>
);

/* detail ---------------------------------------------------------------- */
const styles = StyleSheet.create({
  detailCallout: {
    marginTop: 16,
  },
  breakdown: {
    marginTop: 16,
  },
  breakdownHead: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    letterSpacing: 0.66,
    lineHeight: rf(15),
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
    fontSize: rf(13),
    lineHeight: rf(18),
  },
  bdTotalAmt: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    lineHeight: rf(18),
    marginLeft: 'auto',
  },
  gcallNote: {
    color: webColors.textSoft,
    fontFamily: fontFamily.regular,
    fontSize: rf(13.5),
    lineHeight: rf(20),
    marginTop: 12,
  },
});
