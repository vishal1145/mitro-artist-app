import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  EarningsBar,
  ListRow,
  LoadFailed,
  Screen,
  SectionLabel,
  SegmentedControl,
  Skeleton,
  StatTile,
} from '@components/shared';
import { Badge, Text } from '@components/ui';
import { useEarningsSummary, useEarningsTransactions } from '@hooks/useInsights';
import { colors, layout, radius, spacing } from '@theme';
import { sourceIcon, sourceLabel } from '@utils/earnings';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, shortDateTime } from '@utils/format';

const FILTERS = ['All', 'Pending', 'Settled'] as const;

/** Anything the server hasn't cleared reads as pending; everything else settled. */
const isPending = (status: string): boolean => status.toLowerCase() === 'pending';

const TransactionsScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');

  const {
    data: summary,
    isLoading: loadingSummary,
  } = useEarningsSummary();
  const {
    data: transactions,
    isLoading: loadingTxns,
    error,
    refetch,
  } = useEarningsTransactions();

  // Totals come from the summary so they reflect the whole ledger, not just
  // the page of rows fetched below.
  const settledTokens =
    (summary?.availableTokens ?? 0) + (summary?.paidOutTokens ?? 0);

  const rows = useMemo(() => {
    const all = transactions ?? [];
    if (filter === 'Pending') {
      return all.filter((t) => isPending(t.status));
    }
    if (filter === 'Settled') {
      return all.filter((t) => !isPending(t.status));
    }
    return all;
  }, [transactions, filter]);

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
          unread
        />
      }
    >
      <Text variant="h1" style={styles.title}>
        Transaction History
      </Text>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      <View style={styles.grid}>
        <StatTile
          icon="clock"
          label="PENDING"
          value={loadingSummary ? '—' : grouped(summary?.pendingTokens ?? 0)}
          unit="tk"
          tint={colors.warning}
        />
        <StatTile
          icon="check-circle"
          label="SETTLED"
          value={loadingSummary ? '—' : grouped(settledTokens)}
          unit="tk"
          tint={colors.success}
        />
      </View>

      <SectionLabel divider style={styles.sectionLabel}>
        RECENT ACTIVITY
      </SectionLabel>

      {error ? (
        <LoadFailed message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : loadingTxns ? (
        <View style={styles.rows}>
          <Skeleton height={56} round={radius.md} />
          <Skeleton height={56} round={radius.md} />
          <Skeleton height={56} round={radius.md} />
        </View>
      ) : (
        <View>
          {rows.map((t, i) => {
            const pending = isPending(t.status);

            return (
              <ListRow
                key={t.id}
                divider={i > 0}
                icon={sourceIcon(t.sourceType)}
                iconTint={colors.primary}
                title={`${sourceLabel(t.sourceType)} from ${t.fromDisplayName}`}
                subtitle={`${t.description} · ${shortDateTime(t.createdAtUtc)}`}
                right={
                  <View style={styles.rowMeta}>
                    <Text variant="link" color={pending ? 'warning' : 'success'}>
                      +{grouped(t.amountTokens)} tk
                    </Text>
                    <Badge
                      label={pending ? 'PENDING' : 'SETTLED'}
                      tone={pending ? 'warning' : 'success'}
                    />
                  </View>
                }
              />
            );
          })}
          {rows.length === 0 ? (
            <Text variant="caption" color="textMuted" align="center" style={styles.empty}>
              No {filter.toLowerCase()} transactions yet.
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.xs,
  },
  rows: {
    gap: spacing.sm,
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
