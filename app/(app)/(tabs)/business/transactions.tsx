import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  CalloutStrong,
  CalloutText,
  LearnLink,
  PageHead,
  SummaryCell,
  SummaryStrip,
  WebCallout,
} from '@components/history';
import { EarningsBar, LoadFailed, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { useDebounce } from '@hooks/useDebounce';
import { useEarningsSummary, useEarningsTransactionsPaged } from '@hooks/useInsights';
import { useNotificationStore } from '@store';
import { colors, fontFamily, gradientDirection, gradients, fontSize, letterSpacing, lineHeight, webColors } from '@theme';
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

/** web `TXN_RANGES`. */
const RANGES: readonly { key: string; label: string; short: string; days: number | null }[] = [
  { key: 'all', label: 'All time', short: 'All time', days: null },
  { key: '7', label: 'Last 7 days', short: '7 days', days: 7 },
  { key: '30', label: 'Last 30 days', short: '30 days', days: 30 },
  { key: '90', label: 'Last 90 days', short: '90 days', days: 90 },
];

const dayKey = (iso: string): string => new Date(iso).toDateString();

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

const TxRow = ({
  txn,
  first,
  onPress,
}: {
  txn: EarningsTransaction;
  first: boolean;
  onPress: () => void;
}) => {
  const iconType = txIconType(txn.sourceType);
  const badge = txBadgeClass(txn.status);
  const tint = TX_TINT[iconType];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.txRow, first ? null : styles.txRowDivider]}
    >
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
          {`${badge === 'refunded' ? '' : '+'}${grouped(txn.amountTokens)} coins`}
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
    </Pressable>
  );
};

/** `.txv-drawer` as a centred popup on phone. */
const TxDetailModal = ({ txn, onClose }: { txn: EarningsTransaction | null; onClose: () => void }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const open = txn !== null;
  useEffect(() => {
    if (open) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [open, anim]);
  const close = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [anim, onClose]);
  if (!txn) {
    return null;
  }
  const iconType = txIconType(txn.sourceType);
  const badge = txBadgeClass(txn.status);
  const tint = badge === 'refunded' ? { bg: colors.surfaceHover, ink: colors.textMuted } : TX_TINT[iconType];
  const d = new Date(txn.createdAtUtc);
  const rows: [string, string][] = [
    ['Type', `Credit · ${webSourceLabel(txn.sourceType)}`],
    ['From', txn.fromDisplayName],
    ['Date', d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })],
    ['Time', d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })],
    ['Note', txn.description ?? webSourceLabel(txn.sourceType)],
    ['Reference', txn.id],
  ];
  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.modalBackdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close details" />
        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: anim,
              transform: [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) },
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.modalHead}>
            <Text style={styles.modalHeadText}>Transaction details</Text>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" style={styles.modalClose}>
              <LucideIcon name="x" size={rf(16)} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.modalHero}>
            <View style={[styles.txIcon, styles.modalIcon, { backgroundColor: tint.bg }]}>
              <LucideIcon name={TX_ICON[iconType]} size={rf(22)} color={tint.ink} />
            </View>
            <Text style={[styles.modalAmt, badge === 'refunded' ? styles.txAmtReversed : null]}>
              {`${badge === 'refunded' ? '' : '+'}${grouped(txn.amountTokens)} coins`}
            </Text>
            <Text style={styles.modalTitle}>{`${webSourceLabel(txn.sourceType)} from ${txn.fromDisplayName}`}</Text>
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
          <View style={styles.modalDetails}>
            {rows.map(([k, v]) => (
              <View key={k} style={styles.modalRow}>
                <Text style={styles.modalKey}>{k}</Text>
                <Text style={styles.modalVal}>{v}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
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
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [selected, setSelected] = useState<EarningsTransaction | null>(null);

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
    const days = RANGES[rangeIdx]?.days ?? null;
    const from = days ? Date.now() - days * 86400000 : null;
    const needle = debouncedQuery.trim().toLowerCase();
    return all.filter((t) => {
      if (filter === 'pending' && t.status !== 'pending') {
        return false;
      }
      if (filter === 'settled' && t.status !== 'available' && t.status !== 'paid_out') {
        return false;
      }
      if (filter === 'refunded' && t.status !== 'refunded' && t.status !== 'reversed') {
        return false;
      }
      if (from !== null && new Date(t.createdAtUtc).getTime() < from) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return `${webSourceLabel(t.sourceType)} ${t.fromDisplayName} ${t.description ?? ''} ${t.groupCallTitle ?? ''}`
        .toLowerCase()
        .includes(needle);
    });
  }, [transactions, filter, debouncedQuery, rangeIdx]);

  /** Day groups with net coins (refunded rows excluded), like `.txv-group`. */
  const groups = useMemo(() => {
    const todayKey = new Date().toDateString();
    const yKey = new Date(Date.now() - 86400000).toDateString();
    const out: { key: string; label: string; net: number; rows: EarningsTransaction[] }[] = [];
    filtered.forEach((t) => {
      const k = dayKey(t.createdAtUtc);
      let g = out[out.length - 1];
      if (!g || g.key !== k) {
        g = {
          key: k,
          label: k === todayKey ? 'Today' : k === yKey ? 'Yesterday' : new Date(t.createdAtUtc).toLocaleDateString(),
          net: 0,
          rows: [],
        };
        out.push(g);
      }
      if (txBadgeClass(t.status) !== 'refunded') {
        g.net += t.amountTokens;
      }
      g.rows.push(t);
    });
    return out;
  }, [filtered]);

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
      </View>

      <WebCallout>
        <CalloutText>
          <CalloutStrong>This is your full coin ledger</CalloutStrong> — every credit fans send you
          (reactions, fun-wheel spins, highlighted messages, group-call entries, reward-menu
          purchases) alongside every debit whenever you withdraw earnings to your bank account. Use
          the <CalloutStrong>All / Pending / Settled / Refunded</CalloutStrong> filters below to see
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
          stacked
          icon="wallet"
          tint="cyan"
          label="Transactions"
          value={loadingSummary ? '—' : grouped(summary?.totalTransactions ?? 0)}
          hint="Total number of real paid interactions fans have sent you (pending, available, or paid out). Refunded transactions aren't counted here."
        />
        <SummaryCell
          stacked
          icon="clock-3"
          tint="gold"
          label="Pending"
          value={loadingSummary ? '—' : `${grouped(pendingTokens)} coins`}
          hint="Coins from transactions still in the platform's hold window — usually clears within 24–48 hours before it counts toward your balance."
        />
        <SummaryCell
          stacked
          icon="check"
          tint="green"
          label="Settled"
          value={loadingSummary ? '—' : `${grouped(settledTokens)} coins`}
          hint="Coins that have actually cleared and count toward your available balance. Refunded transactions are never included here."
        />
        <SummaryCell
          stacked
          icon="bar-chart-3"
          tint="purple"
          label="This week"
          value={loadingSummary ? '—' : `${grouped(weekTokens)} coins`}
          hint="Real coins earned from transactions in the last 7 days, excluding anything that was refunded."
        />
      </SummaryStrip>

      {/* .txv-toolbar */}
      <View style={[styles.toolbar, styles.toolbarZ]}>
        <View style={styles.search}>
          <LucideIcon name="search" size={rf(15)} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by fan, source or type"
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const on = f.key === filter;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setFilter(f.key)}
                style={on ? styles.pillOn : styles.pillIdle}
              >
                {on ? (
                  <LinearGradient
                    colors={gradients.primary}
                    start={gradientDirection.diagonal.start}
                    end={gradientDirection.diagonal.end}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <Text numberOfLines={1} style={on ? styles.pillTextOn : styles.pillText}>{f.label}</Text>
              </Pressable>
            );
          })}
          <View style={styles.rangeWrap}>
            <Pressable
              style={styles.range}
              accessibilityRole="button"
              accessibilityLabel="Date range"
              accessibilityState={{ expanded: rangeOpen }}
              onPress={() => setRangeOpen((o) => !o)}
            >
              <Text numberOfLines={1} style={styles.rangeText}>{RANGES[rangeIdx]?.short}</Text>
              <LucideIcon name="chevron-down" size={rf(14)} color={colors.textMuted} />
            </Pressable>
            {rangeOpen ? (
              <View style={styles.rangeMenu}>
                {RANGES.map((r, i) => (
                  <Pressable
                    key={r.key}
                    accessibilityRole="menuitem"
                    style={[styles.rangeItem, i === rangeIdx ? styles.rangeItemOn : null]}
                    onPress={() => {
                      setRangeIdx(i);
                      setRangeOpen(false);
                    }}
                  >
                    <Text style={styles.rangeText}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <WebCallout tone="gold" icon="clock-3">
        <CalloutText>
          <CalloutStrong>Pending</CalloutStrong> means a fan&apos;s coins have been sent but are
          still in the platform&apos;s hold window before they&apos;re released to your balance —
          this usually clears within 24–48 hours. Once a row flips to{' '}
          <CalloutStrong>Settled</CalloutStrong>, those coins count toward what you can withdraw to
          your bank account. <CalloutStrong>Refunded</CalloutStrong> means the charge was reversed
          and the coins went back to the fan — those never count toward your balance, even though
          the row still shows the original amount.
        </CalloutText>
      </WebCallout>

      {/* .txv-list */}
      <View style={styles.ledgerCard}>
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
              <Text style={styles.emptyBody}>Try a different filter or search.</Text>
            </View>
          ) : (
            <>
              {groups.map((g) => (
                <View key={g.key}>
                  <View style={styles.groupHead}>
                    <Text style={styles.groupText}>{g.label}</Text>
                    <Text style={styles.groupText}>{`+${grouped(g.net)} coins`}</Text>
                  </View>
                  {g.rows.map((txn, i) => <TxRow key={txn.id} txn={txn} first={i === 0} onPress={() => setSelected(txn)} />)}
                </View>
              ))}
              {hasNextPage ? (
                <View style={styles.loadMore}>
                  <ActivityIndicator size="small" color={webColors.pinkHot} />
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>
      <TxDetailModal txn={selected} onClose={() => setSelected(null)} />
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

  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 20,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  modalHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalHeadText: { color: colors.textMuted, fontFamily: fontFamily.bold, fontSize: fontSize.small },
  modalClose: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  modalHero: { alignItems: 'center', gap: 8 },
  modalIcon: { height: 44, width: 44 },
  modalAmt: { color: colors.green, fontFamily: fontFamily.mono, fontSize: fontSize.body, fontWeight: '600' },
  modalTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: fontSize.body, textAlign: 'center' },
  modalDetails: { borderTopColor: colors.borderSoft, borderTopWidth: 1 },
  modalRow: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  modalKey: { color: colors.textDim, fontFamily: fontFamily.regular, fontSize: fontSize.small, width: 80 },
  modalVal: { color: colors.text, flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.small },
  toolbar: { gap: 12 },
  search: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    minWidth: 0,
    paddingVertical: 0,
  },
  toolbarZ: { zIndex: 10, elevation: 10 },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
  },
  pillIdle: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pillOn: {
    borderColor: colors.transparent,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pillText: {
    color: colors.textMuted,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
  },
  pillTextOn: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
  },
  rangeWrap: { flexShrink: 0, marginLeft: 'auto' },
  range: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    height: 32,
    paddingHorizontal: 8,
  },
  rangeMenu: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 12,
    minWidth: 140,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 36,
    zIndex: 20,
  },
  rangeItem: { paddingHorizontal: 12, paddingVertical: 10 },
  rangeItemOn: { backgroundColor: colors.surfaceHover },
  rangeText: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
  },
  groupHead: {
    backgroundColor: colors.backgroundDeep,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupText: {
    color: colors.textDim,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    textTransform: 'uppercase',
  },

  /* .ledger-card ----------------------------------------------------------- */
  ledgerCard: {
    overflow: 'hidden',
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 8,
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
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    lineHeight: lineHeight.mono,
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
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
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
    borderRadius: 8,
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
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
  },
  txSmall: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
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
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
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
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.mono,
    lineHeight: lineHeight.mono,
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
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
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
    fontSize: fontSize.small,
    lineHeight: lineHeight.small,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBody: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
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
