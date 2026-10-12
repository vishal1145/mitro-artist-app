import { Feather } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, HIT_TARGET, radius, spacing, typography } from '@theme';
import { rf } from '@utils/responsive';

export interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  /** Small pink mono label above the title (web .eyebrow). */
  eyebrow?: string;
  eyebrowIcon?: keyof typeof Feather.glyphMap;
  /** One muted line under the heading. */
  subtitle?: string;
  /** Count bubble shown immediately after the title. Hidden when 0. */
  badge?: number;
  /** Rendered right after the title (e.g. an ON/OFF pill). */
  titleAdornment?: ReactNode;
  /** Trailing slot — a pill button, help chip, etc. */
  right?: ReactNode;
}

/**
 * THE page header for every pushed or tab-root screen: round back arrow,
 * optional eyebrow, title, optional subtitle, optional trailing action.
 * Same on every screen, same as the web.
 */
const PageHeaderComponent = ({
  title,
  onBack,
  eyebrow,
  eyebrowIcon,
  subtitle,
  badge,
  titleAdornment,
  right,
}: PageHeaderProps) => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
      ) : null}

      <View style={styles.heading}>
        {eyebrow ? (
          <View style={styles.eyebrowRow}>
            {eyebrowIcon ? <Feather name={eyebrowIcon} size={rf(12)} color={colors.pink} /> : null}
            <Text variant="label" color="pink" numberOfLines={1}>
              {eyebrow}
            </Text>
          </View>
        ) : null}
        {/* Title and its count travel together, so the number reads as part
            of the heading rather than as another trailing control. */}
        <View style={styles.titleRow}>
          <Text variant="h1" numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          {titleAdornment}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {right}
    </View>
    {subtitle ? (
      <Text variant="bodySm" color="textSecondary">
        {subtitle}
      </Text>
    ) : null}
  </View>
);

export const PageHeader = memo(PageHeaderComponent);

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, gap: spacing.xxs },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: { flexShrink: 1 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.badge,
    color: colors.white,
  },
});
