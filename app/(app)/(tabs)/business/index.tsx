import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { InfoCallout, Screen, StatTile } from '@components/shared';
import { Card, GradientButton, LogoBadge, Text } from '@components/ui';
import { colors, fontFamily, gradients, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

/** Business tab — Earnings Dashboard. */
const EarningsScreen = () => {
  const router = useRouter();
  const goToLedger = () => router.push('/(app)/(tabs)/business/transactions');

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* App bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <LogoBadge variant="wave" size={wp(8)} />
          <Text variant="h3" style={styles.appBarTitle}>
            Earnings
          </Text>
        </View>
        <View style={styles.appBarRight}>
          <Ionicons name="notifications-outline" size={rf(22)} color={colors.textSecondary} />
          <Pressable style={styles.walletBtn} onPress={goToLedger} accessibilityRole="button" accessibilityLabel="Open ledger">
            <Ionicons name="wallet-outline" size={rf(18)} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.heading}>
        <Text variant="h2">Earnings Dashboard</Text>
        <Text variant="caption" color="textSecondary">
          Real token earnings from highlighted messages, reactions, rewards, and the fun wheel across your broadcasts.
        </Text>
      </View>

      <InfoCallout tone="success" icon="information-circle-outline" linkLabel="Learn how earnings are calculated" onLinkPress={goToLedger}>
        <Text variant="caption" color="textSecondary">
          This dashboard tallies every token earned from{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            private shows, group calls, reactions, tips, and the fun wheel
          </Text>
          . The trend chart plots tokens earned per day.{' '}
        </Text>
      </InfoCallout>

      <InfoCallout tone="warning">
        <Text variant="caption" color="textSecondary">
          All earnings below are shown in tokens and currently sit as{' '}
          <Text variant="caption" color="warning" style={styles.bold}>
            pending
          </Text>
          . Withdrawals aren&apos;t available until setup is finalized.
        </Text>
      </InfoCallout>

      {/* All-time hero */}
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroPill}>
          <Ionicons name="sparkles" size={rf(12)} color={colors.primary} />
          <Text variant="label" color="primary">
            ALL-TIME
          </Text>
        </View>
        <Text variant="display" align="center" style={styles.heroValue}>
          0 tokens
        </Text>
        <Text variant="caption" color="textSecondary" align="center">
          0 paid interactions across all your broadcasts.
        </Text>
        <View style={styles.heroChips}>
          <View style={styles.heroChip}>
            <Ionicons name="time-outline" size={rf(13)} color={colors.textSecondary} />
            <Text variant="label" color="textSecondary">
              0 pending
            </Text>
          </View>
          <View style={styles.heroChip}>
            <Ionicons name="wallet-outline" size={rf(13)} color={colors.textSecondary} />
            <Text variant="label" color="textSecondary">
              0 available
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stat grid 2x2 */}
      <View style={styles.grid}>
        <StatTile icon="cash-outline" label="Total Tokens" value="0" tint={colors.primary} sub="0 txns" />
        <StatTile icon="gift-outline" label="Pending" value="0" tint={colors.warning} badge={{ label: 'Awaiting payout', tone: 'warning' }} />
      </View>
      <View style={styles.grid}>
        <StatTile icon="wallet-outline" label="Available" value="0" tint={colors.success} badge={{ label: 'Ready', tone: 'success' }} />
        <StatTile icon="checkmark-done-outline" label="Paid Out" value="0" tint={colors.primary} sub="Lifetime" />
      </View>

      <GradientButton
        label="Withdraw Tokens"
        gradient="primary"
        textColor="ctaDark"
        leftIcon="cash-outline"
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/business/withdraw',
            params: { availableTk: '0' },
          })
        }
      />

      <InfoCallout
        tone="neutral"
        icon="card-outline"
        linkLabel="Complete KYC verification"
        onLinkPress={() => router.push('/(app)/(tabs)/me/kyc-payouts')}
      >
        <Text variant="caption" color="textSecondary">
          Tokens move from{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            Pending
          </Text>{' '}
          to{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            Available
          </Text>{' '}
          once a payout window closes. You&apos;ll need to complete{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            KYC verification
          </Text>{' '}
          before any payout can be sent to your bank account.
        </Text>
      </InfoCallout>

      {/* Trend */}
      <Card style={styles.trend}>
        <View style={styles.trendHeader}>
          <View>
            <Text variant="h3">Earnings Trend</Text>
            <Text variant="caption" color="textMuted">
              Last 7 days (tokens earned per day)
            </Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="bar-chart-outline" size={rf(16)} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.chart}>
          <LinearGradient colors={[colors.primary, colors.success]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chartLine} />
          <Text variant="caption" color="textMuted" align="center" style={styles.chartLabel}>
            Mon
          </Text>
        </View>

        <Text variant="caption" color="textMuted" align="center">
          No paid interactions yet. Once viewers react, tip, or spin the fun wheel during your broadcasts, they&apos;ll show up here.
        </Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appBarTitle: {
    fontSize: rf(17),
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  walletBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: spacing.xs,
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: rf(34),
  },
  heroChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.chipSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trend: {
    gap: spacing.md,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.md,
    backgroundColor: colors.iconChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    height: wp(28),
    justifyContent: 'center',
    gap: spacing.md,
  },
  chartLine: {
    height: rf(3),
    borderRadius: radius.full,
  },
  chartLabel: {
    marginTop: spacing.sm,
  },
});

export default EarningsScreen;
