import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';
import { webColors } from '@theme';

/** `.tx-row` skeleton — main.tsx 4694–4706. */
export const TxRowSkeleton = ({ first }: { first: boolean }) => (
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
  txMainSkel: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  txRightSkel: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 8,
  },
});
