import { memo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, spacing } from '@theme';

export interface LoaderProps {
  message?: string;
  /** Fills its parent and centers — use for full-screen loading states. */
  fullscreen?: boolean;
}

/** Standard loading indicator for the async "loading" state. */
const LoaderComponent = ({
  message,
  fullscreen = true,
}: LoaderProps) => {
  return (
    <View
      style={[styles.container, fullscreen ? styles.fullscreen : null]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text variant="body" color="textMuted" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

export const Loader = memo(LoaderComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: spacing.md,
  },
});
