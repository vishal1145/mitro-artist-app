import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';

export interface SegmentedControlProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** 'pills' = separate rounded chips; 'inset' = joined track (for compact toggles). */
  variant?: 'pills' | 'inset';
  style?: StyleProp<ViewStyle>;
}

/** Horizontal single-select control. */
const SegmentedControlComponent = ({ options, value, onChange, variant = 'pills', style }: SegmentedControlProps) => {
  const inset = variant === 'inset';

  return (
    <View style={[inset ? styles.track : styles.row, style]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              inset ? styles.segment : styles.pill,
              active ? styles.active : inset ? null : styles.pillIdle,
            ]}
          >
            <Text variant="label" color={active ? 'ctaDark' : 'textSecondary'}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const SegmentedControl = memo(SegmentedControlComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  pillIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  active: {
    backgroundColor: colors.primary,
  },
});
