import { StyleSheet, View } from 'react-native';

import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { fontFamily, webColors } from '@theme';
import { rf } from '@utils/responsive';

import { HelpTip } from './HelpTip';

/* -------------------------------------------------------------------------- */
/* .stat-tile                                                                  */
/* -------------------------------------------------------------------------- */

type StatAccent = 'total' | 'pending' | 'available' | 'paidout';

export const STAT_ACCENT: Record<
  StatAccent,
  { icBg: string; icInk: string; chipBg: string; chipInk: string }
> = {
  total: {
    icBg: 'rgba(255, 63, 173, 0.15)',
    icInk: webColors.pinkHot,
    chipBg: 'rgba(66, 245, 167, 0.14)',
    chipInk: webColors.green,
  },
  pending: {
    icBg: 'rgba(255, 200, 107, 0.14)',
    icInk: webColors.gold,
    chipBg: 'rgba(255, 200, 107, 0.14)',
    chipInk: webColors.gold,
  },
  available: {
    icBg: 'rgba(52, 231, 255, 0.14)',
    icInk: webColors.cyan,
    chipBg: 'rgba(66, 245, 167, 0.14)',
    chipInk: webColors.green,
  },
  paidout: {
    icBg: 'rgba(140, 77, 255, 0.15)',
    icInk: webColors.purple,
    chipBg: webColors.surfaceSoft,
    chipInk: webColors.dim,
  },
};

interface StatTileProps {
  accent: StatAccent;
  icon: LucideIconName;
  label: string;
  value: string;
  chip: string;
  help: string;
}

export const StatTile = ({ accent, icon, label, value, chip, help }: StatTileProps) => {
  const tint = STAT_ACCENT[accent];
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIc, { backgroundColor: tint.icBg }]}>
        <LucideIcon name={icon} size={rf(17)} color={tint.icInk} />
      </View>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <HelpTip text={help} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={[styles.statChip, { backgroundColor: tint.chipBg }]}>
        <Text style={[styles.statChipText, { color: tint.chipInk }]}>{chip}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statTile: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statIc: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  statLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statLabel: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
  },
  statValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(24),
    lineHeight: rf(29),
  },
  statChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statChipText: {
    fontFamily: fontFamily.bold,
    fontSize: rf(10.5),
    lineHeight: rf(14),
  },
});
