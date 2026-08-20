import { Feather } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily } from '@theme';
import { rf } from '@utils/responsive';

export interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  /** Count bubble shown immediately after the title. Hidden when 0. */
  badge?: number;
  /** Trailing slot — a pill button, help chip, etc. */
  right?: ReactNode;
}

/**
 * Pushed-screen header: circular back button, left-aligned title, optional
 * trailing action. Distinct from `Header`, which centres its title.
 */
const PageHeaderComponent = ({ title, onBack, badge, right }: PageHeaderProps) => (
  <View style={styles.row}>
    {onBack ? (
      <Pressable
        onPress={onBack}
        style={styles.back}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Feather name="chevron-left" size={rf(20)} color={colors.textPrimary} />
      </Pressable>
    ) : null}

    {/* Title and its count travel together, so the number reads as part of
        the heading rather than as another trailing control. */}
    <View style={styles.titleRow}>
      <Text variant="h2" numberOfLines={1}>
        {title}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>

    {right}
  </View>
);

export const PageHeader = memo(PageHeaderComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(11),
    color: colors.white,
  },
});
