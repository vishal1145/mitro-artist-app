import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { callUi, colors } from '@theme';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

export type ChipVariant = 'danger' | 'neutral' | 'gift' | 'stats';

export interface RoundChipProps {
  variant: ChipVariant;
  icon: FeatherIconName;
  /** Accessibility label — also what the chip "is" (End call, Chat, …). */
  label: string;
  onPress: () => void;
  /** Selected panel chips fill with the brand gradient. */
  active?: boolean;
  /** Count bubble, e.g. pending deliveries. Hidden at 0. */
  badge?: number;
}

/**
 * One round chip of the room action bar.
 *
 * Extracted verbatim from the Live Broadcast studio's `renderChip` so every
 * room surface uses the identical control — same 46pt circle, same variant
 * fills, same active gradient and badge.
 */
export const RoundChip = memo(({ variant, icon, label, onPress, active = false, badge = 0 }: RoundChipProps) => {
  const v = callUi.chip[variant];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.chip, !active && styles.chipIdle, !active && { backgroundColor: v.bg, borderColor: v.border }]}
    >
      {active ? (
        <LinearGradient colors={callUi.activeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chipGradient} />
      ) : null}
      <Feather name={icon} size={rf(19)} color={active ? callUi.white : v.icon} />
      {badge > 0 ? (
        <View style={styles.chipBadge}><Text variant="label" color="onError">{badge}</Text></View>
      ) : null}
    </Pressable>
  );
});
RoundChip.displayName = 'RoundChip';

const styles = StyleSheet.create({
  chip: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  chipIdle: { borderWidth: 1 },
  chipGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 23 },
  chipBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
});
