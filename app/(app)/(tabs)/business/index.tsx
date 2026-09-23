import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  LearnLink,
  WebCallout,
} from '@components/history';
import { EarningsBar, LoadFailed, Screen } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { GlowOverlay } from '@screens/business/earnings/components/GlowOverlay';
import { HelpTip } from '@screens/business/earnings/components/HelpTip';
import { LoadingBody } from '@screens/business/earnings/components/LoadingBody';
import { SourcePieChart } from '@screens/business/earnings/components/SourcePieChart';
import { StatTile } from '@screens/business/earnings/components/StatTile';
import { TrendChart } from '@screens/business/earnings/components/TrendChart';
import { TwoColGrid } from '@screens/business/earnings/components/TwoColGrid';
import { legendPct, pieColor } from '@screens/business/earnings/format';
import { useEarningsDashboard } from '@screens/business/earnings/useEarningsDashboard';
import { useNotificationStore } from '@store';
import { fontFamily, webColors } from '@theme';
import { webSourceHint, webSourceLabel } from '@utils/earnings';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';
import { showPopupToast } from '@utils/toast';

/**
 * Earnings Dashboard — a faithful mobile replica of the Artist Web's
 * `CreatorEarningsScreen` (`src/main.tsx` 4128–4468) and its
 * `.earnings-dashboard-page` styles (`src/styles.css` 24482–24959).
 *
 * Data comes from `useEarningsSummary()` → `/api/artist/earnings/summary`; the
 * hook and its shape are unchanged. Only the presentation matches the web now:
 * page-head, cyan/green info-callouts, the gold notice, the hero + four stat
 * tiles, the 7-bar trend chart, and the SVG donut "Revenue by Source".
 */

/** Business tab root — the web's Earnings Dashboard, at mobile width. */
const EarningsScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);
  const { data, isLoading, error, refetch } = useEarningsDashboard();

  const topSource = data?.bySource[0];
  const totalTokens = data?.totalTokens ?? 0;

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread={hasUnread}
        />
      }
    >
      {/* .page-head — a main tab screen, so no back button. */}
      <View style={styles.pageHead}>
        <Text style={styles.h1}>Earnings Dashboard</Text>
        <Text style={styles.headP}>
          Real coin earnings from highlighted messages, reactions, rewards, and the fun wheel
          across your broadcasts.
        </Text>
      </View>

      {isLoading ? (
        <LoadingBody />
      ) : error ? (
        <LoadFailed message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          {/* .info-callout (cyan) */}
          <WebCallout icon="info">
            <CalloutText>
              This dashboard tallies every coin earned from{' '}
              <CalloutStrong>
                private shows, group calls, reactions, tips, and the fun wheel
              </CalloutStrong>
              , then splits it out in the source breakdown below so you can see exactly what&apos;s
              driving your income. The <CalloutStrong>trend chart</CalloutStrong> plots coins
              earned per day — spikes usually line up with a highlighted broadcast or an active fun
              wheel session.{' '}
              <LearnLink
                label="Learn how earnings are calculated"
                onPress={() =>
                  showPopupToast(
                    "Earnings source drill-down isn't part of this concept pass yet",
                    'info',
                  )
                }
              />
            </CalloutText>
          </WebCallout>

          {/* .notice — gold shield-check banner */}
          <View style={styles.notice}>
            <View style={styles.noticeIcon}>
              <LucideIcon name="shield-check" size={rf(16)} color={webColors.gold} />
            </View>
            <Text style={styles.noticeText}>
              All earnings below are shown in coins and currently sit as{' '}
              <Text style={styles.noticeStrong}>pending</Text>. Payout and commission rules
              haven&apos;t been finalized yet, so withdrawals aren&apos;t available in the app until
              that&apos;s set up.
            </Text>
          </View>

          {/* .hero-grid — single column on a phone. */}
          <LinearGradient
            colors={['#171331', '#0a0918']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.heroCard}
          >
            <GlowOverlay />

            <View style={styles.eyebrow}>
              <LucideIcon name="sparkles" size={rf(12)} color={webColors.gold} />
              <Text style={styles.eyebrowText}>All-time</Text>
              <HelpTip
                text="Total coins you've earned across every paid interaction, since you started creating."
                color={webColors.gold}
              />
            </View>

            <Text style={styles.heroBig}>{totalTokens.toLocaleString()} coins</Text>
            <Text style={styles.heroP}>
              {data?.totalTransactions ?? 0} paid interactions across all your broadcasts.
              {topSource ? ` ${webSourceLabel(topSource.sourceType)} is your top source.` : ''}
            </Text>

            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <LucideIcon name="clock-3" size={rf(13)} color={webColors.muted} />
                <Text style={styles.heroPillText}>
                  {(data?.pendingTokens ?? 0).toLocaleString()} pending
                </Text>
              </View>
              <View style={styles.heroPill}>
                <LucideIcon name="credit-card" size={rf(13)} color={webColors.muted} />
                <Text style={styles.heroPillText}>
                  {(data?.availableTokens ?? 0).toLocaleString()} available
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Four .stat-tile in a 2-column grid. */}
          <TwoColGrid gap={14}>
            <StatTile
              accent="total"
              icon="circle-dollar-sign"
              label="Total Coins"
              value={totalTokens.toLocaleString()}
              chip={`${data?.totalTransactions ?? 0} txns`}
              help="Every coin you've earned from all paid interactions, combined — pending, available, and already paid out."
            />
            <StatTile
              accent="pending"
              icon="gift"
              label="Pending"
              value={(data?.pendingTokens ?? 0).toLocaleString()}
              chip="Awaiting payout"
              help="Coins you've earned that haven't cleared the payout window yet. They move to Available once it closes."
            />
            <StatTile
              accent="available"
              icon="wallet"
              label="Available"
              value={(data?.availableTokens ?? 0).toLocaleString()}
              chip="Ready"
              help="Coins that have cleared and are ready to withdraw to your bank account once KYC verification is complete."
            />
            <StatTile
              accent="paidout"
              icon="coins"
              label="Paid Out"
              value={(data?.paidOutTokens ?? 0).toLocaleString()}
              chip="Lifetime"
              help="Coins you've already withdrawn to your bank account, lifetime total."
            />
          </TwoColGrid>

          {/* .info-callout.green */}
          <WebCallout tone="green" icon="credit-card">
            <CalloutText>
              Coins move from <CalloutStrong>Pending</CalloutStrong> to{' '}
              <CalloutStrong>Available</CalloutStrong> once a payout window closes, and withdrawals
              from Available typically process within 24–48 hours once requested. You&apos;ll need to
              complete <CalloutStrong>KYC verification</CalloutStrong> on the Settings page before
              any payout can be sent to your bank account.
            </CalloutText>
          </WebCallout>

          {/* .trend-card */}
          <View style={styles.trendCard}>
            <View style={styles.trendHead}>
              <View style={styles.trendHeadText}>
                <View style={styles.titleRow}>
                  <Text style={styles.trendTitle}>Earnings Trend</Text>
                  <HelpTip text="How many coins you earned each day over the last 7 days — spikes usually line up with a highlighted broadcast or an active fun wheel session." />
                </View>
                <Text style={styles.trendSub}>Last 7 days (coins earned per day)</Text>
              </View>
              <View style={styles.trendIcon}>
                <LucideIcon name="bar-chart-3" size={rf(17)} color={webColors.muted} />
              </View>
            </View>
            <TrendChart points={data?.last7Days ?? []} />
          </View>

          {/* .source-pie-card */}
          <LinearGradient
            colors={['#171331', '#0a0918']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.pieCard}
          >
            <GlowOverlay />

            <View style={styles.trendHead}>
              <View style={styles.trendHeadText}>
                <View style={styles.titleRow}>
                  <Text style={styles.trendTitle}>Revenue by Source</Text>
                  <HelpTip text="A breakdown of your total coins by the activity that earned them, so you can see what's driving your income." />
                </View>
                <Text style={styles.trendSub}>Where your coins come from</Text>
              </View>
              <View style={styles.pieHeadIcon}>
                <LucideIcon name="pie-chart" size={rf(17)} color={webColors.pinkHot} />
              </View>
            </View>

            {(data?.bySource ?? []).length === 0 ? (
              <Text style={styles.emptyText}>
                No paid interactions yet. Once viewers react, tip, or spin the fun wheel during your
                broadcasts, they&apos;ll show up here.
              </Text>
            ) : (
              <View style={styles.pieBody}>
                <SourcePieChart sources={data!.bySource} totalTokens={data!.totalTokens} />
                <View style={styles.legend}>
                  {data!.bySource.map((source, i) => {
                    const pct = legendPct(source.tokens, data!.totalTokens);
                    const color = pieColor(i);
                    return (
                      <View
                        key={source.sourceType}
                        style={[styles.legendRow, i > 0 ? styles.legendRowDivider : null]}
                      >
                        <View style={styles.legendTop}>
                          <View style={[styles.legendDot, { backgroundColor: color }]} />
                          <View style={styles.legendNameWrap}>
                            <Text style={styles.legendName} numberOfLines={1}>
                              {webSourceLabel(source.sourceType)}
                            </Text>
                            <HelpTip text={webSourceHint(source.sourceType)} />
                          </View>
                          <Text style={[styles.legendPct, { color }]}>{pct}%</Text>
                        </View>
                        <Text style={styles.legendAmt}>
                          {source.tokens.toLocaleString()} coins · {source.count} txns
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </LinearGradient>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  /** `.creator-view { gap: 20px }`; `.creator-main { padding: 12px }` at ≤768px. */
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },

  /* .page-head ------------------------------------------------------------ */
  pageHead: {
    marginTop: 12,
  },
  h1: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    letterSpacing: -0.22,
    lineHeight: rf(27),
    marginBottom: 4,
  },
  headP: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(19),
  },

  /* .notice --------------------------------------------------------------- */
  notice: {
    backgroundColor: 'rgba(255, 200, 107, 0.08)',
    borderColor: 'rgba(255, 200, 107, 0.28)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  noticeIcon: {
    marginTop: 1,
  },
  noticeText: {
    color: webColors.muted,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(18.5),
  },
  noticeStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
  },

  /* .hero-card ------------------------------------------------------------ */
  heroCard: {
    borderColor: webColors.panelBorder,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 200,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  heroCorner: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    top: 18,
    width: 34,
    zIndex: 2,
  },

  /* .eyebrow — gold pill (this page, not the gradient-ink KYC one). */
  eyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 200, 107, 0.14)',
    borderColor: 'rgba(255, 200, 107, 0.3)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrowText: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.5),
    letterSpacing: 0.5,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  heroBig: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(32),
    letterSpacing: -0.32,
    lineHeight: rf(38),
    marginBottom: 8,
  },
  heroP: {
    color: webColors.muted,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(19.5),
    marginBottom: 14,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroPill: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  heroPillText: {
    color: webColors.muted,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
  },

  /* .trend-card ----------------------------------------------------------- */
  trendCard: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  trendHead: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  trendHeadText: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  trendTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(15.5),
    lineHeight: rf(20),
    marginBottom: 3,
  },
  trendSub: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
  },
  trendIcon: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },

  /* .source-pie-card ------------------------------------------------------ */
  pieCard: {
    borderColor: webColors.panelBorder,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  pieHeadIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 63, 173, 0.14)',
    borderColor: 'rgba(255, 63, 173, 0.32)',
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  /** `.source-pie-body` collapses to a centred column at ≤640px. */
  pieBody: {
    alignItems: 'center',
    gap: 22,
  },
  legend: {
    alignSelf: 'stretch',
    gap: 2,
  },
  legendRow: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  legendRowDivider: {
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
  },
  legendTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendNameWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minWidth: 0,
  },
  legendName: {
    color: webColors.textStrong,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: rf(13.5),
    lineHeight: rf(18),
    minWidth: 0,
  },
  legendPct: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },
  legendAmt: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11),
    lineHeight: rf(15),
    marginLeft: 21,
    marginTop: 2,
  },
  emptyText: {
    color: webColors.textSoft,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(20),
  },
});

export default EarningsScreen;
