import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, radius } from '@theme';
import { pressable } from '@utils/press';
import { rf } from '@utils/responsive';

export interface LoadFailedProps {
  /** The server's own wording, when there is one. */
  message?: string | null;
  /** Omit to show the message alone, with no action. */
  onRetry?: () => void;
  /** True while the retry request is in flight. */
  isRetrying?: boolean;
}

/**
 * A failed load, with a way out.
 *
 * Every data screen needs this: an error string on its own leaves the artist
 * with nothing to do but back out of the screen and come back in, which is a
 * dead end dressed up as a message.
 */
const LoadFailedComponent = ({ message, onRetry, isRetrying }: LoadFailedProps) => (
  <View style={styles.wrap} accessibilityRole="summary">
    <View style={styles.icon}>
      <Feather name="wifi-off" size={rf(20)} color={colors.error} />
    </View>

    <Text variant="bodyLg" align="center" style={styles.title}>
      Couldn&apos;t load this
    </Text>
    <Text variant="bodySm" color="textMuted" align="center" style={styles.message}>
      {message ?? 'Check your connection and try again.'}
    </Text>

    {onRetry ? (
      <Pressable
        onPress={onRetry}
        disabled={isRetrying}
        style={pressable(styles.retry)}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Feather name="refresh-cw" size={rf(13)} color={colors.textPrimary} />
        <Text variant="bodySm" style={styles.retryLabel}>
          {isRetrying ? 'Retrying…' : 'Try again'}
        </Text>
      </Pressable>
    ) : null}
  </View>
);

export const LoadFailed = memo(LoadFailedComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: fontFamily.bold,
    marginBottom: 6,
  },
  message: {
    marginBottom: 18,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryLabel: {
    fontFamily: fontFamily.bold,
  },
});
