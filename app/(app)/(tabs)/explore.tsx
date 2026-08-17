import { StyleSheet, View } from 'react-native';

import { Screen } from '@components/shared';
import { Text } from '@components/ui';
import { spacing } from '@theme';

/** Explore tab — stub. Awaiting the Stitch design before building the UI. */
const ExploreScreen = () => {
  return (
    <Screen>
      <View style={styles.container}>
        <Text variant="h1">Explore</Text>
        <Text variant="body" color="textMuted">
          Discovery and search will live here.
        </Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
});

export default ExploreScreen;
