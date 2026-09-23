import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@components/shared';
import { Text } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

export interface SessionStatsSheetProps {
  visible: boolean;
  onClose: () => void;
  sessionEarnings: number;
  peakViewer: number;
  sessionGifts: number;
}

export const SessionStatsSheet = ({ visible, onClose, sessionEarnings, peakViewer, sessionGifts }: SessionStatsSheetProps) => (
  <BottomSheet visible={visible} onClose={onClose} title="Session stats" snapPoints={[0.36]}>
    <View style={styles.statsSheet}>
      <View style={styles.statCell}>
        <View style={[styles.statIc, { backgroundColor: colors.successChip }]}><Feather name="dollar-sign" size={rf(16)} color={colors.green} /></View>
        <Text variant="label" color="textMuted">EARNINGS</Text>
        <Text variant="h2" color="green">{sessionEarnings}</Text>
      </View>
      <View style={styles.statCell}>
        <View style={[styles.statIc, { backgroundColor: colors.cyanSoft }]}><Feather name="users" size={rf(16)} color={colors.cyan} /></View>
        <Text variant="label" color="textMuted">PEAK</Text>
        <Text variant="h2" color="textPrimary">{peakViewer}</Text>
      </View>
      <View style={styles.statCell}>
        <View style={[styles.statIc, { backgroundColor: colors.pinkSoft }]}><Feather name="gift" size={rf(16)} color={colors.pink} /></View>
        <Text variant="label" color="textMuted">GIFTS</Text>
        <Text variant="h2" color="textPrimary">{sessionGifts}</Text>
      </View>
    </View>
  </BottomSheet>
);

const styles = StyleSheet.create({
  statsSheet: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  statCell: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.cardRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.md },
  statIc: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
