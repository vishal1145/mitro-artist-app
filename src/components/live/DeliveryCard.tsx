import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Feather } from '@expo/vector-icons';

import { Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

export interface DeliveryCardProps {
  icon: 'gift' | 'star';
  title: string;
  count: number;
  rows: ReactNode;
}

/**
 * "Manage this stream/call" bottom-sheet card — a heading with a pending
 * count, then either the passed-in rows or "Nothing owed right now."
 *
 * This exact card (same markup, same styles) was duplicated verbatim across
 * live-broadcast-room, group-call-room and private-call-room — the actual
 * per-row content (rendered by each screen's own `.map`) still lives in each
 * screen, only this shell is shared.
 */
export const DeliveryCard = ({ icon, title, count, rows }: DeliveryCardProps) => (
  <View style={styles.deliveryCard}>
    <View style={styles.deliveryHead}>
      <Feather name={icon} size={rf(16)} color={colors.gold} />
      <Text variant="bodyLg" color="textPrimary" style={styles.bold}>
        {title}
        {count > 0 ? ` (${count} pending)` : ''}
      </Text>
    </View>
    {count === 0 ? <Text variant="bodySm" color="textMuted">Nothing owed right now.</Text> : rows}
  </View>
);

const styles = StyleSheet.create({
  bold: { fontFamily: fontFamily.bold },
  deliveryCard: { backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, gap: spacing.xs },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
});
