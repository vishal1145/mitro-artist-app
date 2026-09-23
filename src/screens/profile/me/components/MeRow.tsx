import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { colors, fontFamily, radius, typography } from '@theme';
import { rf } from '@utils/responsive';

import type { Row } from '../types';

interface MeRowProps {
  row: Row;
  /** Suppresses the bottom divider on the last row of a section. */
  last: boolean;
  onPress: () => void;
}

/** One ACCOUNT/ACTIVITY row — reused identically for both sections. */
export const MeRow = ({ row, last, onPress }: MeRowProps) => (
  <Pressable
    style={[styles.row, last ? null : styles.rowDivider]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={row.title}
    accessibilityHint={row.sub}
  >
    <View style={[styles.rowIcon, { backgroundColor: row.fill }]}>
      <Feather name={row.icon} size={rf(17)} color={row.tint} />
    </View>

    <View style={styles.rowText}>
      <Text variant="bodyLg" color="textPrimary" style={styles.rowTitle}>
        {row.title}
      </Text>
      <Text variant="bodySm" color="textMuted" numberOfLines={1}>
        {row.sub}
      </Text>
    </View>

    {row.pill ? (
      <View style={styles.pill}>
        <Text variant="label" color="gold">
          {row.pill}
        </Text>
      </View>
    ) : null}

    {row.badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{row.badge}</Text>
      </View>
    ) : null}

    <Feather name="chevron-right" size={rf(16)} color={colors.textMuted} />
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fontFamily.bold,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    ...typography.badge,
    color: colors.white,
  },
});
