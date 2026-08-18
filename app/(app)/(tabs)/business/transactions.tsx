import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Header, InfoCallout, ListRow, Screen, SegmentedControl, StatTile } from '@components/shared';
import { Badge, Card, Text, type BadgeTone } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;
type TxnStatus = 'Pending' | 'Settled';

interface Txn {
  icon: IoniconName;
  title: string;
  sub: string;
  amount: string;
  status: TxnStatus;
}

const TXNS: Txn[] = [
  { icon: 'dice-outline', title: 'Fun Wheel from vishal_9953', sub: 'Fun-wheel spin in group call · 8/17/2026', amount: '+25 tk', status: 'Pending' },
  { icon: 'star-outline', title: 'Rewards from vishal_9953', sub: "Reward 'Say My Name' · 8/17/2026", amount: '+20 tk', status: 'Pending' },
  { icon: 'chatbubble-outline', title: 'Highlight from user_12x', sub: 'Highlighted message · 8/16/2026', amount: '+10 tk', status: 'Settled' },
];

const FILTERS = ['All', 'Pending', 'Settled'] as const;

const STATUS_TONE: Record<TxnStatus, BadgeTone> = { Pending: 'warning', Settled: 'success' };

const TransactionsScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');

  const rows = useMemo(
    () => (filter === 'All' ? TXNS : TXNS.filter((t) => t.status === filter)),
    [filter],
  );

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Transaction History" onBack={() => router.back()} />

      <View style={styles.heading}>
        <Text variant="h2">Transaction History</Text>
        <Text variant="caption" color="textSecondary">
          Every paid highlighted message, reaction, reward, and fun-wheel spin viewers have sent you.
        </Text>
      </View>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      <InfoCallout tone="success" icon="information-circle-outline" linkLabel="Learn more about your ledger">
        <Text variant="caption" color="textSecondary">
          This is your full{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            coin ledger
          </Text>{' '}
          — every credit fans send you (reactions, fun-wheel spins, highlighted messages, group-call entries, reward-menu purchases) alongside every debit whenever you withdraw earnings to your bank account.
        </Text>
      </InfoCallout>

      <View style={styles.grid}>
        <StatTile icon="time-outline" label="PENDING" value="819" unit="tk" tint={colors.warning} />
        <StatTile icon="checkmark-circle-outline" label="SETTLED" value="0" unit="tk" tint={colors.success} />
      </View>

      <Card style={styles.ledger}>
        <View style={styles.ledgerBadge}>
          <Ionicons name="link-outline" size={rf(13)} color={colors.warning} />
          <Text variant="label" color="warning">
            LEDGER
          </Text>
        </View>
        <Text variant="h3">Recent Activity</Text>

        <InfoCallout tone="warning" icon="information-circle-outline">
          <Text variant="caption" color="textSecondary">
            <Text variant="caption" color="onSurface" style={styles.bold}>
              Pending
            </Text>{' '}
            means a fan&apos;s coins have been sent but are still in the platform&apos;s hold window before they&apos;re released to your balance — this usually clears within 24-48 hours.
          </Text>
        </InfoCallout>

        <View style={styles.rows}>
          {rows.map((t, i) => (
            <ListRow
              key={`${t.title}-${i}`}
              icon={t.icon}
              iconTint={colors.primary}
              title={t.title}
              subtitle={t.sub}
              right={
                <View style={styles.rowMeta}>
                  <Text variant="link" color="warning">
                    {t.amount}
                  </Text>
                  <Badge label={t.status.toUpperCase()} tone={STATUS_TONE[t.status]} />
                </View>
              }
            />
          ))}
          {rows.length === 0 ? (
            <Text variant="caption" color="textMuted" align="center" style={styles.empty}>
              No {filter.toLowerCase()} transactions yet.
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    gap: spacing.xs,
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ledger: {
    gap: spacing.md,
  },
  ledgerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.warningChip,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  rows: {
    gap: spacing.xs,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  empty: {
    paddingVertical: spacing.md,
  },
});

export default TransactionsScreen;
