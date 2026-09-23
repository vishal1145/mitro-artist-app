import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import type { PrivateCallHistoryItem } from '@app-types/privateCall';
import { typography, webColors } from '@theme';

import { formatCallDuration, historyStatusMeta, TONE_FILL, TONE_INK } from '../format';

interface HistoryRowProps {
  item: PrivateCallHistoryItem;
  last: boolean;
}

const HistoryRowComponent = ({ item, last }: HistoryRowProps) => {
  const meta = historyStatusMeta(item.status, item.endReason);
  const duration = formatCallDuration(item.acceptedAtUtc, item.endedAtUtc);
  return (
    <View style={[styles.historyRow, last ? styles.historyRowLast : null]}>
      <View style={[styles.historyIcon, { backgroundColor: TONE_FILL[meta.tone] }]}>
        <LucideIcon name="phone" size={15} color={TONE_INK[meta.tone]} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>
          {meta.label}
        </Text>
        <Text style={styles.historyMeta} numberOfLines={1}>
          {`${item.acceptedAtUtc ? new Date(item.acceptedAtUtc).toLocaleString('en-US') : 'never accepted'}${duration ? ` • ${duration}` : ''}`}
        </Text>
      </View>
      <View style={styles.historyAmount}>
        <LucideIcon name="coins" size={13} color={webColors.textStrong} />
        <Text style={styles.historyAmountText}>
          {(item.totalCoinsCharged - item.totalRefundedCoins).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export const HistoryRow = memo(HistoryRowComponent);

/** One loading row of the History list — mirrors the web's `.mitro-skel` set. */
const HistorySkeletonRowComponent = () => (
  <View style={styles.historyRow}>
    <Skeleton width={30} height={30} round={10} />
    <View style={styles.historySkelText}>
      <Skeleton width="55%" height={12} round={6} />
      <Skeleton width="75%" height={10} round={6} />
    </View>
    <Skeleton width={54} height={14} round={6} />
  </View>
);

export const HistorySkeletonRow = memo(HistorySkeletonRowComponent);

/* --- .pcall-history-list / .pcall-history-row --- */
const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: webColors.hairline,
  },
  historyRowLast: {
    borderBottomWidth: 0,
  },
  historySkelText: {
    flex: 1,
    gap: 7,
  },
  historyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    ...typography.bodyLg,
    color: webColors.textStrong,
  },
  historyMeta: {
    ...typography.bodySm,
    color: webColors.white45,
  },
  historyAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyAmountText: {
    ...typography.buttonSm,
    color: webColors.textStrong,
  },
});
