import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';

/** `GcallAnalyticsSkeleton` — six chips over the breakdown rows. */
export const AnalyticsSkeleton = () => (
  <View style={styles.skelAnalytics}>
    <View style={styles.skelChips}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} height={58} round={12} style={styles.skelChip} />
      ))}
    </View>
    <Skeleton height={20} round={6} />
    <Skeleton height={20} round={6} />
    <Skeleton height={20} round={6} />
    <Skeleton height={30} round={8} />
  </View>
);

const styles = StyleSheet.create({
  skelAnalytics: {
    gap: 10,
    paddingTop: 14,
  },
  skelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  skelChip: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
