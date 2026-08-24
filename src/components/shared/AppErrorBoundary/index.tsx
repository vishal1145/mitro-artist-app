import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, radius } from '@theme';
import { pressable } from '@utils/press';
import { rf } from '@utils/responsive';

export interface AppErrorBoundaryProps {
  error: Error;
  retry: () => void;
}

/**
 * Catches a render crash and shows it instead of letting the app close.
 *
 * expo-router picks this up from a route's `ErrorBoundary` export. Without it
 * a release build dies silently — the app just vanishes, with no message and
 * no way to tell a missing native module from a bad render. In dev the red box
 * shows the stack; in a release APK there is nothing at all, which makes a
 * crash on a real device almost impossible to diagnose.
 *
 * The message and stack are shown deliberately, including in release. This is
 * a pre-launch app being tested on real phones — a readable error is worth far
 * more than a polished apology screen.
 */
export const AppErrorBoundary = ({ error, retry }: AppErrorBoundaryProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <View style={styles.icon}>
        <Feather name="alert-triangle" size={rf(22)} color={colors.error} />
      </View>

      <Text variant="h3" align="center" style={styles.title}>
        Something broke on this screen
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        <Text variant="bodySm" color="error" selectable style={styles.message}>
          {error.message || 'Unknown error'}
        </Text>
        {error.stack ? (
          <Text variant="bodySm" color="textMuted" selectable style={styles.stack}>
            {error.stack}
          </Text>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={retry}
        style={pressable(styles.retry)}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Feather name="refresh-cw" size={rf(13)} color={colors.textPrimary} />
        <Text variant="bodySm" style={styles.retryLabel}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    marginBottom: 16,
  },
  scroll: {
    alignSelf: 'stretch',
    flex: 1,
  },
  scrollBody: {
    paddingBottom: 16,
  },
  message: {
    fontFamily: fontFamily.bold,
    marginBottom: 12,
  },
  stack: {
    fontSize: rf(9),
    lineHeight: rf(13),
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryLabel: {
    fontFamily: fontFamily.bold,
  },
});
