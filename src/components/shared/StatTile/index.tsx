import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Badge, Card, Text, type BadgeTone } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface StatTileProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  unit?: string;
  unitColor?: keyof typeof colors;
  tint?: string;
  sub?: string;
  badge?: { label: string; tone?: BadgeTone };
  style?: StyleProp<ViewStyle>;
}

/** Compact metric card: icon chip + mono label + large value, optional badge/sub. */
const StatTileComponent = ({ icon, label, value, unit, unitColor = 'textMuted', tint, sub, badge, style }: StatTileProps) => (
  <Card style={[styles.card, style]}>
    <View style={styles.top}>
      <View style={styles.chip}>
        <Feather name={icon} size={rf(16)} color={tint ?? colors.textSecondary} />
      </View>
      <Text variant="label" color="textMuted" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>

    <View style={styles.valueRow}>
      <Text variant="h2" style={styles.value}>
        {value}
      </Text>
      {unit ? (
        <Text variant="caption" color={unitColor} style={styles.unit}>
          {unit}
        </Text>
      ) : null}
    </View>

    {badge ? <Badge label={badge.label} tone={badge.tone ?? 'neutral'} /> : null}
    {sub ? (
      <Text variant="caption" color="textMuted">
        {sub}
      </Text>
    ) : null}
  </Card>
);

export const StatTile = memo(StatTileComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    width: wp(8),
    height: wp(8),
    borderRadius: radius.md,
    backgroundColor: colors.iconChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  value: {
    fontSize: rf(19),
  },
  unit: {
    marginBottom: rf(3),
  },
});
