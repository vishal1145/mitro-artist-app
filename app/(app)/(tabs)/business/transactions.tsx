import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  FilterPills,
  HelpIcon,
  LearnLink,
  PageHead,
  SummaryCell,
  SummaryStrip,
  WebCallout,
} from '@components/history';
import { EarningsBar, LoadFailed, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { useEarningsSummary, useEarningsTransactionsPaged } from '@hooks/useInsights';
import { useNotificationStore } from '@store';
import { fontFamily, webColors } from '@theme';
import { webSourceLabel } from '@utils/earnings';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, webDateTime } from '@utils/format';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

import type { EarningsTransaction } from '@app-types/api';

/**
 * Transaction History — a replica of the Artist Web's
 * `CreatorTransactionHistoryScreen` at mobile widths.
 *
 * Web sources, read line-by-line and matched value-for-value:
 *   • `src/main.tsx` 4512–4741 — `txIconType`, `TX_ICON_BY_TYPE`, `txDescription`,
 *     `txBadgeClass`, and the whole `.tx-history-page` JSX tree.
 *   • `src/services/earningsService.ts` 47–73 — `earningSourceLabel`, mirrored
 *     into `webSourceLabel` so the row titles read identically.
 *   • `src/styles.css` 25804–26150 — the `.tx-history-page` block, including
 *     `@media (max-width: 760px)` which drops `.summary-strip` to
 *     `repeat(2, minmax(0, 1fr))` (styles.css 25868).
 *
 * Data layer untouched: still `useEarningsTransactions()`. The web computes its
 * four summary numbers from the same transaction list rather than from
 * `/earnings/summary`, so this screen now does too — which also removes the
 * second request the old version made.
 */

/* -------------------------------------------------------------------------- */
/* Row helpers — main.tsx 4512–4560                                            */
/* -------------------------------------------------------------------------- */

type TxIconType = 'reaction' | 'wheel' | 'entry' | 'highlighted' | 'reward';

const txIconType = (sourceType: string): TxIconType => {
  switch (sourceType) {
    case 'reaction':
      return 'reaction';
    case 'fun_wheel_spin':
      return 'wheel';
    case 'group_call_entry':
      return 'entry';
    case 'highlighted_message':
      return 'highlighted';
    default:
      return 'reward';
  }
};

/** `TX_ICON_BY_TYPE` — the exact lucide glyph the web puts in each tile. */
const TX_ICON: Record<TxIconType, LucideIconName> = {
  reaction: 'heart',
  wheel: 'clock-3',
  entry: 'video',
  highlighted: 'star',
  reward: 'check',
};

/** `.tx-icon.<type>` tints. */
const TX_TINT: Record<TxIconType, { bg: string; ink: string }> = {
  reaction: { bg: webColors.pinkChip, ink: webColors.pinkHot },
  wheel: { bg: webColors.cyanChip, ink: webColors.cyan },
  entry: { bg: webColors.purpleChip, ink: webColors.purple },
  highlighted: { bg: webColors.goldChip, ink: webColors.gold },
  reward: { bg: webColors.greenPill, ink: webColors.green },
};

type TxBadge = 'pending' | 'settled' | 'refunded';

/** `txBadgeClass` — "available" and "paid_out" both read as settled. */
const txBadgeClass = (status: string): TxBadge => {
  if (status === 'pending') {
    return 'pending';
  }
  if (status === 'refunded' || status === 'reversed') {
    return 'refunded';
  }
  return 'settled';
};

type TxFilter = 'all' | 'pending' | 'settled' | 'refunded';

const FILTERS: readonly { key: TxFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'settled', label: 'Settled' },
  { key: 'refunded', label: 'Refunded' },
];

/* -------------------------------------------------------------------------- */
/* .tx-row                                                                     */
/* -------------------------------------------------------------------------- */

/** `txDescription` — main.tsx 4531–4552. */
const TxDescription = ({ txn }: { txn: EarningsTransaction }) => {
  if (txn.sourceType === 'reaction') {
    return (
      <Text style={styles.txSmall} numberOfLines={2}>
        {'Reaction '}
        {txn.reactionIconUrl ? (
          <Image
            source={{ uri: txn.reactionIconUrl }}
            style={styles.reactionIcon}
            accessibilityLabel={txn.reactionName ?? 'reaction'}
          />
        ) : (
          `'${txn.reactionName ?? '?'}'`
        )}
        {' in broadcast · '}
        {webDateTime(txn.createdAtUtc)}
      </Text>
    );
  }
  if (txn.sourceType === 'group_call_entry') {
    return (
      <Text style={styles.txSmall} numberOfLines={2}>
        {txn.description ?? webSourceLabel(txn.sourceType)}
        {txn.groupCallTitle ? ` • ${txn.groupCallTitle}` : ''}
        {' · '}
        {webDateTime(txn.createdAtUtc)}
      </Text>
    );
  }
  return (
    <Text style={styles.txSmall} numberOfLines={2}>
      {txn.description ?? webSourceLabel(txn.sourceType)}
      {' · '}
      {webDateTime(txn.createdAtUtc)}
    </Text>
  );
};

const TxRow = ({ txn, first }: { txn: EarningsTransaction; first: boolean }) => {
  const iconType = txIconType(txn.sourceType);
  const badge = txBadgeClass(txn.status);
  const tint = TX_TINT[iconType];

  return (
    <View style={[styles.txRow, first ? null : styles.txRowDivider]}>
      <View style={[styles.txIcon, { backgroundColor: tint.bg }]}>
        <LucideIcon name={TX_ICON[iconType]} size={rf(17)} color={tint.ink} />
      </View>

      <View style={styles.txMain}>
        <Text style={styles.txStrong}>
          {`${webSourceLabel(txn.sourceType)} from ${txn.fromDisplayName}`}
        </Text>
        <TxDescription txn={txn} />
      </View>

      <View style={styles.txRight}>
        <Text style={[styles.txAmt, badge === 'refunded' ? styles.txAmtReversed : null]}>
          {`${badge === 'refunded' ? '' : '+'}${grouped(txn.amountTokens)} tk`}
        </Text>
        <View
          style={[
            styles.txStatus,
            badge === 'pending' ? styles.txStatusPending : null,
            badge === 'settled' ? styles.txStatusSettled : null,
            badge === 'refunded' ? styles.txStatusRefunded : null,
          ]}
        >
          <Text
            style={[
              styles.txStatusText,
              badge === 'pending' ? styles.txStatusInkPending : null,
              badge === 'settled' ? styles.txStatusInkSettled : null,
              badge === 'refunded' ? styles.txStatusInkRefunded : null,
            ]}
          >
            {txn.status}
          </Text>
        </View>
      </View>
    </View>
  );
};

/** `.tx-row` skeleton — main.tsx 4694–4706. */
const TxRowSkeleton = ({ first }: { first: boolean }) => (
  <View style={[styles.txRow, first ? null : styles.txRowDivider]}>
    <Skeleton width={34} height={34} round={10} />
    <View style={styles.txMainSkel}>
      <Skeleton width="55%" height={12} round={6} />
      <Skeleton width="38%" height={10} round={6} />
    </View>
    <View style={styles.txRightSkel}>
      <Skeleton width={80} height={13} round={6} />
      <Skeleton width={58} height={18} round={9} />
    </View>
  </View>
);

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

/** Rows fetched per request. */
const PAGE_SIZE = 25;

const TransactionsScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);
  const [filter, setFilter] = useState<TxFilter>('all');

  /*
   * The web asks for a flat `getTransactions(100)` and stops; this walks the
   * ledger a page at a time so older rows stay reachable. Everything below —
   * the four summary tiles and the filters — is computed over the pages loaded
   * so far, which for the first page matches the web exactly.
   */
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEarningsTransactionsPaged(PAGE_SIZE);

  const transactions = useMemo(() => data?.pages.flat() ?? [], [data]);

  /*
   * The four tiles come from `GET /api/artist/earnings/summary`, NOT from the
   * rows on screen.
   *
   * They are whole-ledger figures — this artist has 1,179 transactions — so
   * adding up whatever page happens to be loaded gives a number that is both
   * wrong and drifts as you scroll. The server already aggregates them, and
   * excludes refunded/reversed rows while doing it (EarningsController's
   * `liveRows` filter), which is the same rule the list applies per row.
   */
  const { data: summary, isLoading: loadingSummary } = useEarningsSummary();

  const pendingTokens = summary?.pendingTokens ?? 0;
  const settledTokens = (summary?.availableTokens ?? 0) + (summary?.paidOutTokens ?? 0);
  /** `last7Days` is server-computed, oldest first, zero-filled to seven entries. */
  const weekTokens = useMemo(
    () => (summary?.last7Days ?? []).reduce((sum, d) => sum + d.tokens, 0),
    [summary],
  );

  const filtered = useMemo(() => {
    const all = transactions ?? [];
    if (filter === 'pending') {
      return all.filter((t) => t.status === 'pending');
    }
    if (filter === 'settled') {
      return all.filter((t) => t.status === 'available' || t.status === 'paid_out');
    }
    if (filter === 'refunded') {
      return all.filter((t) => t.status === 'refunded' || t.status === 'reversed');
    }
    return all;
  }, [transactions, filter]);

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      // Pull the next page in as the artist nears the bottom — no button.
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      }}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread={hasUnread}
        />
      }
    >
      {/* `.page-head` — h1 over a dim p, with `.filter-pills` wrapping below
          it at phone width (the web's page-head is `flex-wrap: wrap`). */}
      <View style={styles.pageHead}>
        <PageHead
          title="Transaction History"
          subtitle="Every paid highlighted message, reaction, reward, and fun-wheel spin viewers have sent you."
        />
        <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <WebCallout>
        <CalloutText>
          <CalloutStrong>This is your full coin ledger</CalloutStrong> — every credit fans send you
          (reactions, fun-wheel spins, highlighted messages, group-call entries, reward-menu
          purchases) alongside every debit whenever you withdraw earnings to your bank account. Use
          the <CalloutStrong>All / Pending / Settled / Refunded</CalloutStrong> filters above to see
          only what&apos;s still clearing, what&apos;s already been added to your available balance,
          or what got sent back to the fan.{' '}
          <LearnLink
            label="Learn about exporting your ledger"
            onPress={() =>
              showToast("Ledger export isn't part of this concept pass yet", 'info')
            }
          />
        </CalloutText>
      </WebCallout>

      <SummaryStrip>
        <SummaryCell
          icon="wallet"
          tint="cyan"
          label="Transactions"
          value={loadingSummary ? '—' : grouped(summary?.totalTransactions ?? 0)}
          hint="Total number of real paid interactions fans have sent you (pending, available, or paid out). Refunded transactions aren't counted here."
        />
        <SummaryCell
          icon="clock-3"
          tint="gold"
          label="Pending"
          value={loadingSummary ? '—' : `${grouped(pendingTokens)} tk`}
          hint="Coins from transactions still in the platform's hold window — usually clears within 24–48 hours before it counts toward your balance."
        />
        <SummaryCell
          icon="check"
          tint="green"
          label="Settled"
          value={loadingSummary ? '—' : `${grouped(settledTokens)} tk`}
          hint="Coins that have actually cleared and count toward your available balance. Refunded transactions are never included here."
        />
        <SummaryCell
          icon="bar-chart-3"
          tint="purple"
          label="This week"
          value={loadingSummary ? '—' : `${grouped(weekTokens)} tk`}
          hint="Real coins earned from transactions in the last 7 days, excluding anything that was refunded."
        />
      </SummaryStrip>

      {/* .ledger-card */}
      <View style={styles.ledgerCard}>
        <View style={styles.ledgerHead}>
          <View style={styles.eyebrow}>
            <LucideIcon name="coins" size={rf(12)} color={webColors.gold} />
            <Text style={styles.eyebrowText}>Ledger</Text>
          </View>
          <View style={styles.ledgerH2Row}>
            <Text style={styles.ledgerH2}>Recent Activity</Text>
            <HelpIcon hint="Every individual paid transaction fans have sent you, newest first — the source, who sent it, how much, and whether it's pending or settled." />
          </View>
        </View>

        <View style={styles.ledgerCallout}>
          <WebCallout tone="gold" icon="clock-3">
            <CalloutText>
              <CalloutStrong>Pending</CalloutStrong> means a fan&apos;s coins have been sent but are
              still in the platform&apos;s hold window before they&apos;re released to your balance
              — this usually clears within 24–48 hours. Once a row flips to{' '}
              <CalloutStrong>Settled</CalloutStrong>, those coins count toward what you can withdraw
              to your bank account. <CalloutStrong>Refunded</CalloutStrong> means the charge was
              reversed and the coins went back to the fan — those never count toward your balance,
              even though the row still shows the original amount.
            </CalloutText>
          </WebCallout>
        </View>

        <View>
          {error ? (
            <View style={styles.loadFailed}>
              <LoadFailed message={getErrorMessage(error)} onRetry={() => void refetch()} />
            </View>
          ) : isLoading ? (
            [0, 1, 2, 3, 4, 5].map((i) => <TxRowSkeleton key={i} first={i === 0} />)
          ) : !transactions || transactions.length === 0 ? (
            <Text style={styles.earningsEmpty}>
              No paid interactions yet. They&apos;ll appear here as soon as a viewer sends one
              during your broadcasts.
            </Text>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStrong}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>Try a different filter.</Text>
            </View>
          ) : (
            <>
              {filtered.map((txn, i) => <TxRow key={txn.id} txn={txn} first={i === 0} />)}
              {hasNextPage ? (
                <View style={styles.loadMore}>
                  <ActivityIndicator size="small" color={webColors.pinkHot} />
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  /** `.creator-main { padding: 12px }` at ≤768px; `.creator-view { gap: 20px }`. */
  content: {
    gap: 20,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  /** `.page-head { gap: 16px; flex-wrap: wrap }` — the pills wrap under the
   *  title block at phone width, 16px below it. */
  pageHead: {
    gap: 16,
    marginTop: 12,
  },

  /* .ledger-card ----------------------------------------------------------- */
  ledgerCard: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 18,
    borderWidth: 1,
  },
  /** `.ledger-head { padding: 16px 18px 12px }`. */
  ledgerHead: {
    paddingBottom: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  /** `.tx-history-page .eyebrow` — gold pill, 4/10, mb 8. */
  eyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderColor: webColors.goldCalloutBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrowText: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.5),
    letterSpacing: 0.53,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  /** `.ledger-head h2 { display:flex; gap:5px; margin: 8px 0 0; 1rem/800 }`. */
  ledgerH2Row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  ledgerH2: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(16),
    lineHeight: rf(21),
  },
  /** `.ledger-card .tx-ledger-callout { margin: 0 18px 14px }`. */
  ledgerCallout: {
    marginBottom: 14,
    marginHorizontal: 18,
  },

  /* .tx-row ---------------------------------------------------------------- */
  txRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  /** `border-top: 1px solid rgba(255,255,255,.06)`, dropped on `:first-child`. */
  txRowDivider: {
    borderTopColor: webColors.hairline06,
    borderTopWidth: 1,
  },
  txIcon: {
    alignItems: 'center',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  txMain: {
    flex: 1,
    minWidth: 0,
  },
  txMainSkel: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  txStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(13.5),
    lineHeight: rf(19),
  },
  txSmall: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(17),
  },
  /** `.bcast-reaction-icon` — the fan's reaction glyph, inline in the subline. */
  reactionIcon: {
    height: rf(14),
    width: rf(14),
  },
  txRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  txRightSkel: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 8,
  },
  txAmt: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  txAmtReversed: {
    color: webColors.dim,
    textDecorationLine: 'line-through',
  },
  txStatus: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  txStatusPending: {
    backgroundColor: webColors.goldChip,
  },
  txStatusSettled: {
    backgroundColor: webColors.greenPill,
  },
  txStatusRefunded: {
    backgroundColor: webColors.txRefundedChip,
  },
  txStatusText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  txStatusInkPending: {
    color: webColors.gold,
  },
  txStatusInkSettled: {
    color: webColors.green,
  },
  txStatusInkRefunded: {
    color: webColors.premiumDanger,
  },

  /* empty / error ----------------------------------------------------------- */
  /** `.earnings-empty { padding: 24px; text-align: center; color: --text-soft }`. */
  earningsEmpty: {
    color: webColors.textSoft,
    fontFamily: fontFamily.regular,
    fontSize: rf(16),
    lineHeight: rf(24.8),
    padding: 24,
    textAlign: 'center',
  },
  /** `.empty-state { padding: 50px 20px; text-align: center; color: dim }`. */
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  emptyStrong: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(14.5),
    lineHeight: rf(20),
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBody: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(16),
    lineHeight: rf(24.8),
    textAlign: 'center',
  },
  loadFailed: {
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  /** Sits on the last `.tx-row`'s divider, so it reads as one more row. */
  loadMore: {
    alignItems: 'center',
    borderTopColor: webColors.hairline06,
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});

export default TransactionsScreen;
