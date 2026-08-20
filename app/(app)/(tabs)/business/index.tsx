import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EarningsBar, Screen, SectionLabel, TimelineRow } from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

/** Where the tokens came from. Values are absolute, shares are derived. */
const SOURCES = [
  { label: 'Highlighted msgs', value: 420, color: colors.pink },
  { label: 'Rewards', value: 380, color: colors.gold },
  { label: 'Reactions', value: 260, color: colors.cyan },
  { label: 'Fun wheel', value: 180, color: colors.violet },
];

const TREND = [
  { day: 'Mon', value: 40 },
  { day: 'Tue', value: 85 },
  { day: 'Wed', value: 120 },
  { day: 'Thu', value: 95 },
  { day: 'Fri', value: 210 },
  { day: 'Sat', value: 145 },
  { day: 'Sun', value: 320 },
];

const PAYOUTS = [
  {
    id: 'po_1',
    title: 'Rs 9,200 sent to bank',
    meta: '5d ago · HDFC ···4821',
    dot: colors.green,
  },
  {
    id: 'po_2',
    title: 'Payout window closed',
    meta: 'Aug 12 · balances locked for review',
    dot: colors.textMuted,
  },
];

const PEAK = Math.max(...TREND.map((t) => t.value));

/** Business tab root — lifetime earnings, their sources, trend and payouts. */
const EarningsScreen = () => {
  const router = useRouter();

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread
        />
      }
    >

      <Text variant="h1" style={styles.title}>
        Earnings
      </Text>

      {/* All-time hero */}
      <LinearGradient
        colors={gradients.cta}
        start={gradientDirection.diagonal.start}
        end={gradientDirection.diagonal.end}
        style={styles.hero}
      >
        <Pressable
          style={styles.heroChip}
          onPress={() => router.push('/(app)/(tabs)/business/transactions')}
          accessibilityRole="button"
          accessibilityLabel="Transaction history"
        >
          <Feather name="file-text" size={rf(17)} color={colors.screen} />
        </Pressable>

        <Text style={styles.heroLabel}>ALL-TIME EARNED</Text>

        <View style={styles.heroValueRow}>
          <Text style={styles.heroValue}>1,240</Text>
          <Text style={styles.heroUnit}>tokens</Text>
        </View>

        <View style={styles.heroPills}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>674 PENDING</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>0 AVAILABLE</Text>
          </View>
        </View>
      </LinearGradient>

      <Text variant="bodySm" color="gold" align="center" style={styles.kycNote}>
        Withdrawals need KYC.{' '}
        <Text
          variant="bodySm"
          color="white"
          style={styles.kycLink}
          onPress={() => router.push('/(app)/(tabs)/me/kyc-payouts')}
        >
          Complete KYC
        </Text>
      </Text>

      {/* Nothing is withdrawable until KYC clears, so the CTA stays inert. */}
      <View style={styles.withdraw}>
        <LinearGradient
          colors={gradients.ctaMuted}
          start={gradientDirection.horizontal.start}
          end={gradientDirection.horizontal.end}
          style={styles.withdrawFill}
        >
          <Text style={styles.withdrawLabel}>Withdraw Tokens</Text>
        </LinearGradient>
      </View>

      <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
        WHERE IT CAME FROM
      </SectionLabel>

      {/* Single stacked bar — each segment is that source's share of the total */}
      <View style={styles.stack}>
        {SOURCES.map((s) => (
          <View
            key={s.label}
            style={[styles.stackSeg, { flex: s.value, backgroundColor: s.color }]}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {SOURCES.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text variant="bodySm" color="textSecondary" style={styles.legendLabel}>
              {s.label}
            </Text>
            <Text variant="bodySm" color="textPrimary" style={styles.legendValue}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      <SectionLabel style={styles.sectionLabel}>EARNINGS TREND — LAST 7 DAYS</SectionLabel>

      <View style={styles.chart}>
        {TREND.map((t) => {
          const best = t.value === PEAK;

          return (
            <View key={t.day} style={styles.barCol}>
              <Text
                variant="bodySm"
                color={best ? 'pink' : 'textMuted'}
                style={styles.barValue}
              >
                {t.value}
              </Text>
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={gradients.cta}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.bar, { height: `${(t.value / PEAK) * 100}%` }]}
                />
              </View>
              <Text variant="bodySm" color={best ? 'textPrimary' : 'textMuted'}>
                {t.day}
              </Text>
            </View>
          );
        })}
      </View>

      <SectionLabel style={styles.sectionLabel}>RECENT PAYOUTS</SectionLabel>

      {PAYOUTS.map((p, i) => (
        <TimelineRow
          key={p.id}
          title={p.title}
          meta={p.meta}
          dotColor={p.dot}
          last={i === PAYOUTS.length - 1}
          onPress={() => router.push('/(app)/(tabs)/business/transactions')}
        />
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  title: {
    marginTop: 12,
  },

  hero: {
    borderRadius: radius.card,
    padding: 22,
    marginTop: 16,
  },
  heroChip: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(9),
    letterSpacing: 1.1,
    color: colors.white,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
  },
  heroValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(33),
    lineHeight: rf(39),
    color: colors.white,
  },
  heroUnit: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.white,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroPill: {
    backgroundColor: colors.chipSurface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  heroPillText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(9),
    letterSpacing: 0.8,
    color: colors.white,
  },

  kycNote: {
    marginTop: 18,
    lineHeight: rf(17),
  },
  kycLink: {
    fontFamily: fontFamily.bold,
    textDecorationLine: 'underline',
  },

  withdraw: {
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 18,
  },
  withdrawFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.textMuted,
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 14,
  },

  stack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  stackSeg: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    rowGap: 10,
  },
  legendItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
  },
  legendValue: {
    fontFamily: fontFamily.bold,
  },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 170,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barValue: {
    fontFamily: fontFamily.bold,
    fontSize: rf(9),
  },
  barTrack: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  trendNote: {
    marginTop: 14,
    fontStyle: 'italic',
  },
});

export default EarningsScreen;
