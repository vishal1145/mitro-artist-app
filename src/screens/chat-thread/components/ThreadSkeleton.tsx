import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';
import { radius } from '@theme';

/**
 * Alternating left/right placeholder bubbles for the opening load — mirrors the
 * web thread's skeleton (`pmsg-bubble-row` shimmer blocks) rather than a spinner.
 */
const SKELETON_BUBBLES: { out: boolean; width: `${number}%` }[] = [
  { out: false, width: '55%' },
  { out: true, width: '48%' },
  { out: false, width: '68%' },
  { out: true, width: '40%' },
  { out: false, width: '60%' },
  { out: true, width: '50%' },
];

export const ThreadSkeleton = () => (
  <View style={styles.skeletonThread}>
    {SKELETON_BUBBLES.map((b, i) => (
      <View key={i} style={[styles.skeletonRow, b.out ? styles.skeletonRight : styles.skeletonLeft]}>
        <Skeleton width={b.width} height={44} round={radius.card} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeletonThread: { gap: 12 },
  skeletonRow: { flexDirection: 'row' },
  skeletonLeft: { justifyContent: 'flex-start' },
  skeletonRight: { justifyContent: 'flex-end' },
});
