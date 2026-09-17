import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Children, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import {
  CalloutStrong,
  CalloutText,
  LearnLink,
  WebCallout,
} from '@components/history';
import { EarningsBar, LoadFailed, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { useEarningsSummary } from '@hooks/useInsights';
import { useNotificationStore } from '@store';
import { fontFamily, webColors } from '@theme';
import { webSourceHint, webSourceLabel } from '@utils/earnings';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, shortWeekday } from '@utils/format';
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

/* Web `SOURCE_PIE_COLORS`, verbatim. */
const SOURCE_PIE_COLORS = [
  '#ff3fad',
  '#33e6ff',
  '#8c4dff',
  '#42f5a7',
  '#ffb84d',
  '#ff6b6b',
  '#4d9fff',
  '#f5d442',
] as const;

const pieColor = (index: number): string =>
  SOURCE_PIE_COLORS[index % SOURCE_PIE_COLORS.length];

/* -------------------------------------------------------------------------- */
/* Two-column grid — CSS Grid `repeat(2, minmax(0, 1fr))` for the stat tiles.  */
/* Flexbox would stretch a lone trailing tile; measuring the row and pinning   */
/* each cell to `(width - gap) / 2` keeps the two-up shape and a fixed gap.     */
/* -------------------------------------------------------------------------- */

const TwoColGrid = ({
  gap,
  children,
}: {
  gap: number;
  children: ReactNode;
}) => {
  const [rowWidth, setRowWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width);
  const cellWidth = rowWidth > 0 ? (rowWidth - gap) / 2 : undefined;

  return (
    <View style={[styles.grid, { gap }]} onLayout={onLayout}>
      {Children.map(children, (child) =>
        child == null ? null : <View style={{ width: cellWidth }}>{child}</View>,
      )}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* .stat-tile                                                                  */
/* -------------------------------------------------------------------------- */

type StatAccent = 'total' | 'pending' | 'available' | 'paidout';

const STAT_ACCENT: Record<
  StatAccent,
  { icBg: string; icInk: string; chipBg: string; chipInk: string }
> = {
  total: {
    icBg: 'rgba(255, 63, 173, 0.15)',
    icInk: webColors.pinkHot,
    chipBg: 'rgba(66, 245, 167, 0.14)',
    chipInk: webColors.green,
  },
  pending: {
    icBg: 'rgba(255, 200, 107, 0.14)',
    icInk: webColors.gold,
    chipBg: 'rgba(255, 200, 107, 0.14)',
    chipInk: webColors.gold,
  },
  available: {
    icBg: 'rgba(52, 231, 255, 0.14)',
    icInk: webColors.cyan,
    chipBg: 'rgba(66, 245, 167, 0.14)',
    chipInk: webColors.green,
  },
  paidout: {
    icBg: 'rgba(140, 77, 255, 0.15)',
    icInk: webColors.purple,
    chipBg: webColors.surfaceSoft,
    chipInk: webColors.dim,
  },
};

const StatTile = ({
  accent,
  icon,
  label,
  value,
  chip,
  help,
}: {
  accent: StatAccent;
  icon: LucideIconName;
  label: string;
  value: string;
  chip: string;
  help: string;
}) => {
  const tint = STAT_ACCENT[accent];
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIc, { backgroundColor: tint.icBg }]}>
        <LucideIcon name={icon} size={rf(17)} color={tint.icInk} />
      </View>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <HelpTip text={help} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={[styles.statChip, { backgroundColor: tint.chipBg }]}>
        <Text style={[styles.statChipText, { color: tint.chipInk }]}>{chip}</Text>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* EarningsTrendChart — the web canvas, redrawn as gradient bars.              */
/* -------------------------------------------------------------------------- */

const TrendChart = ({ points }: { points: { date: string; tokens: number }[] }) => {
  const data =
    points.length > 0 ? points : [{ date: new Date().toISOString(), tokens: 0 }];
  const peak = Math.max(0, ...data.map((d) => d.tokens));

  return (
    <View style={styles.chart}>
      {data.map((point, i) => (
        <View key={`${point.date}-${i}`} style={styles.barCol}>
          <Text style={styles.barValue}>{grouped(point.tokens)}</Text>
          <View style={styles.barTrack}>
            <LinearGradient
              colors={['#ff3fad', '#33e6ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.bar,
                { height: peak > 0 ? `${Math.max(4, (point.tokens / peak) * 100)}%` : 4 },
              ]}
            />
          </View>
          <Text style={styles.barDay}>{shortWeekday(point.date)}</Text>
        </View>
      ))}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* SourcePieChart — react-native-svg donut, matching the web SVG 1:1.          */
/* -------------------------------------------------------------------------- */

const SourcePieChart = ({
  sources,
  totalTokens,
}: {
  sources: { sourceType: string; tokens: number; count: number }[];
  totalTokens: number;
}) => {
  const size = 216;
  const r = 82;
  const strokeWidth = 28;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const gap = sources.length > 1 ? 7 : 0;
  let offsetAcc = 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#0d0c1f" strokeWidth={strokeWidth} />
      {sources.map((source, i) => {
        const pct = totalTokens > 0 ? source.tokens / totalTokens : 0;
        const rawLen = pct * circumference;
        const len = Math.max(rawLen - gap, pct > 0 ? 1 : 0);
        const dashoffset = -offsetAcc;
        offsetAcc += rawLen;
        return (
          <Circle
            key={source.sourceType}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={pieColor(i)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${len} ${circumference - len}`}
            strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <SvgText
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill={webColors.textStrong}
        fontFamily={fontFamily.extrabold}
        fontSize={rf(22)}
      >
        {totalTokens.toLocaleString()}
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fill={webColors.dim}
        fontFamily={fontFamily.bold}
        fontSize={rf(10)}
      >
        COINS
      </SvgText>
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/* GlowOverlay — the two radial glows the web layers over the dark base of the  */
/* .hero-card and .source-pie-card (purple top-left, pink bottom-right).        */
/* -------------------------------------------------------------------------- */

const GlowOverlay = () => {
  // Radial gradients in react-native-svg only render smoothly with explicit
  // pixel coordinates (userSpaceOnUse); bounding-box fractions produce a hard
  // rectangular edge. So measure the card, then place the two glows in px:
  // purple top-left, pink bottom-right, each fading fully to transparent.
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <RadialGradient
              id="glowPurple"
              cx={size.w * 0.18}
              cy={0}
              rx={size.w * 0.85}
              ry={size.h * 0.95}
              fx={size.w * 0.18}
              fy={0}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#8c4dff" stopOpacity={0.34} />
              <Stop offset="1" stopColor="#8c4dff" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="glowPink"
              cx={size.w * 0.88}
              cy={size.h}
              rx={size.w * 0.82}
              ry={size.h * 0.9}
              fx={size.w * 0.88}
              fy={size.h}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#ff3fad" stopOpacity={0.24} />
              <Stop offset="1" stopColor="#ff3fad" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#glowPurple)" />
          <Rect width={size.w} height={size.h} fill="url(#glowPink)" />
        </Svg>
      ) : null}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* HelpTip — the web's "?" tooltip. Hover doesn't exist on a phone, so tapping  */
/* the icon opens the same explanatory text in a small dismissible popup.        */
/* -------------------------------------------------------------------------- */

const HelpTip = ({ text, color }: { text: string; color?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="More information"
      >
        <LucideIcon name="circle-help" size={rf(12)} color={color ?? webColors.dim} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.tipScrim} onPress={() => setOpen(false)}>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>{text}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

/** Business tab root — the web's Earnings Dashboard, at mobile width. */
const EarningsScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);
  const { data, isLoading, error, refetch } = useEarningsSummary();

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
                    const pct =
                      data!.totalTokens > 0
                        ? Math.round((source.tokens / data!.totalTokens) * 100)
                        : 0;
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

/** Skeleton stand-ins for the cards while the summary loads. */
const LoadingBody = () => (
  <>
    <Skeleton height={56} round={12} />
    <Skeleton height={48} round={16} />
    <Skeleton height={200} round={20} />
    <View style={styles.grid}>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
    </View>
    <Skeleton height={48} round={16} />
    <Skeleton height={220} round={20} />
    <Skeleton height={260} round={20} />
  </>
);

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

  /* .stat-tile grid ------------------------------------------------------- */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skelHalf: {
    width: '48%',
  },
  statTile: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statIc: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  statLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statLabel: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
  },
  statValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(24),
    lineHeight: rf(29),
  },
  statChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statChipText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(10.5),
    lineHeight: rf(14),
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

  /* trend bars ------------------------------------------------------------ */
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 200,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  barValue: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(9),
    lineHeight: rf(12),
  },
  barTrack: {
    alignSelf: 'stretch',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    width: '100%',
  },
  barDay: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11),
    lineHeight: rf(14),
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

  /* HelpTip popup -------------------------------------------------------- */
  tipScrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  tipCard: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 340,
    padding: 16,
  },
  tipText: {
    color: webColors.muted,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(19),
  },
});

export default EarningsScreen;
