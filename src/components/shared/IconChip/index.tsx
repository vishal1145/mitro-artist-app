import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, size } from '@theme';
import { rf } from '@utils/responsive';

/** Accent tones available for the chip tint. */
export type IconChipTone =
  | 'pink'
  | 'violet'
  | 'purple'
  | 'cyan'
  | 'gold'
  | 'green'
  | 'red';

export interface IconChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent tone — fills at 15% with the solid colour as the icon. */
  tone?: IconChipTone;
  /** Override the icon colour directly (ignores `tone`). */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const TONE: Record<IconChipTone, { fill: string; icon: string }> = {
  pink: { fill: colors.pinkSoft, icon: colors.pink },
  violet: { fill: colors.violetSoft, icon: colors.violet },
  purple: { fill: colors.purpleSoft, icon: colors.purple },
  cyan: { fill: colors.cyanSoft, icon: colors.cyan },
  gold: { fill: colors.goldSoft, icon: colors.gold },
  green: { fill: colors.greenSoft, icon: colors.green },
  red: { fill: colors.redSoft, icon: colors.red },
};

/** 48x48 rounded chip, radius 14, tinted at 15% with a solid accent icon. */
const IconChipComponent = ({ icon, tone = 'pink', color, style }: IconChipProps) => {
  const t = TONE[tone];
  const fillStyle = useMemo<ViewStyle>(() => ({ backgroundColor: t.fill }), [t.fill]);

  return (
    <View style={[styles.chip, fillStyle, style]}>
      <Ionicons name={icon} size={rf(20)} color={color ?? t.icon} />
    </View>
  );
};

export const IconChip = memo(IconChipComponent);

const styles = StyleSheet.create({
  chip: {
    width: size.iconChip,
    height: size.iconChip,
    borderRadius: radius.iconChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
