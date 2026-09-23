import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@components/shared';

/** Skeleton stand-ins for the cards while the summary loads. */
export const LoadingBody = () => (
  <>
    <Skeleton height={56} round={12} />
    <Skeleton height={48} round={16} />
    <Skeleton height={200} round={20} />
    <View style={styles.grid}>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
      <View style={styles.skelHalf}>
        <Skeleton height={116} round={20} />
      </View>
    </View>
    <Skeleton height={48} round={16} />
    <Skeleton height={220} round={20} />
    <Skeleton height={260} round={20} />
  </>
);

const styles = StyleSheet.create({
  /* Same shape as `TwoColGrid`'s own `.grid` (flex-row, wrap) — duplicated
     here rather than imported since this grid never measures a row width;
     the skeleton tiles size themselves with a fixed `%48` instead. */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skelHalf: {
    width: '48%',
  },
});
