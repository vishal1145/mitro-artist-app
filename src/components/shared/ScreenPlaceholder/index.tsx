import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Header } from '@components/shared/Header';
import { Screen } from '@components/shared/Screen';
import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ScreenPlaceholderProps {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  /** Short note describing what this screen will contain. */
  note?: string;
  /** Key/value params the route received — handy while wiring navigation. */
  params?: Record<string, string | undefined>;
  /** Hide the back chevron (for tab root screens). */
  hideBack?: boolean;
}

/**
 * Temporary stand-in for a route that is wired but not yet designed.
 * Keeps navigation testable end-to-end before the real screen lands.
 */
const ScreenPlaceholderComponent = ({
  title,
  icon = 'tool',
  note,
  params,
  hideBack = false,
}: ScreenPlaceholderProps) => {
  const router = useRouter();
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined);

  return (
    <Screen>
      <Header title={title} onBack={hideBack ? undefined : () => router.back()} />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Feather name={icon} size={rf(26)} color={colors.primary} />
        </View>

        <Text variant="h3" align="center">
          {title}
        </Text>
        <Text variant="caption" color="textMuted" align="center">
          {note ?? 'This screen is wired up and ready for its design.'}
        </Text>

        {entries.length ? (
          <View style={styles.params}>
            <Text variant="label" color="textMuted">
              ROUTE PARAMS
            </Text>
            {entries.map(([key, value]) => (
              <Text key={key} variant="caption" color="textSecondary">
                {key}: {String(value)}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
};

export const ScreenPlaceholder = memo(ScreenPlaceholderComponent);

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconWrap: {
    width: wp(16),
    height: wp(16),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  params: {
    marginTop: spacing.lg,
    gap: spacing.xxs,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
