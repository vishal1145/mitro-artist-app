import { StyleSheet, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import type { EarningsTransaction } from '@app-types/api';
import { fontFamily, webColors } from '@theme';
import { webSourceLabel } from '@utils/earnings';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

import { TX_ICON, TX_TINT, txBadgeClass, txIconType } from '../format';
import { TxDescription } from './TxDescription';

export const TxRow = ({ txn, first }: { txn: EarningsTransaction; first: boolean }) => {
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
    </View>
  );
};

/* .tx-row ---------------------------------------------------------------- */
const styles = StyleSheet.create({
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
  txStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(13.5),
    lineHeight: rf(19),
  },
  txRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
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
});
