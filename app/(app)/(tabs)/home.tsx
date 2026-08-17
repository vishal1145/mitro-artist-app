import { StyleSheet, View } from 'react-native';

import { Screen } from '@components/shared';
import { Text } from '@components/ui';
import { spacing } from '@theme';

/** Home tab — stub. Awaiting the Stitch design before building the UI. */
const HomeScreen = () => {
  return (
    <Screen>
      <View style={styles.container}>
        <Text variant="h1">Home</Text>
        <Text variant="body" color="textMuted">
          Your feed will live here.
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

export default HomeScreen;
