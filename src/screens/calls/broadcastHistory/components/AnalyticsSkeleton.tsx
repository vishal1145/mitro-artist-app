import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';

/** `AnalyticsSkeleton` — the tile grid that stands in while analytics load. */
export const AnalyticsSkeleton = () => (
  <View style={styles.skelTiles}>
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} height={92} round={12} style={styles.skelTile} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skelTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 14,
  },
  skelTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
