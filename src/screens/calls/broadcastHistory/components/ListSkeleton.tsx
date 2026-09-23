import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';

/** `SummaryStripSkeleton` + `BroadcastHistorySkeleton`. */
export const ListSkeleton = () => (
  <>
    <View style={styles.skelStrip}>
      <Skeleton height={70} round={14} style={styles.skelCell} />
      <Skeleton height={70} round={14} style={styles.skelCell} />
    </View>
    <View style={styles.skelList}>
      <Skeleton height={68} round={14} />
      <Skeleton height={68} round={14} />
      <Skeleton height={68} round={14} />
    </View>
  </>
);

const styles = StyleSheet.create({
  skelStrip: {
    flexDirection: 'row',
    gap: 12,
  },
  skelCell: {
    flex: 1,
  },
  skelList: {
    gap: 10,
  },
});
