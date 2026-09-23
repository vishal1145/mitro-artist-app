import { StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { radius, typography, webColors } from '@theme';

/** The web's `.pcall-status-pill` — ON is green, OFF is a neutral chip. */
export const StatusPill = ({ on }: { on: boolean }) => (
  <View style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
    <Text style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
      {on ? 'ON' : 'OFF'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  // .pcall-status-pill
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillOn: { backgroundColor: webColors.greenPill, borderColor: webColors.greenRing },
  pillOff: { backgroundColor: webColors.offPill, borderColor: webColors.offPillRing },
  pillText: {
    ...typography.badge,
  },
  pillTextOn: { color: webColors.green },
  pillTextOff: { color: webColors.chipText },
});
