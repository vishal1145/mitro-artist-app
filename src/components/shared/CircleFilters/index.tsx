import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, gradientDirection, gradients } from '@theme';
import { rf } from '@utils/responsive';

export interface CircleFilterOption {
  value: string;
  /** Shown under the circle, uppercased by the `label` type variant. */
  label: string;
  icon: keyof typeof Feather.glyphMap;
  /** Count bubble on the circle. Omit or 0 to hide. */
  badge?: number;
}

export interface CircleFiltersProps {
  options: CircleFilterOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

const SIZE = 52;

/** Row of circular icon filters with labels beneath. Selected one is gradient-filled. */
const CircleFiltersComponent = ({ options, value, onChange, style }: CircleFiltersProps) => (
  <View style={[styles.row, style]}>
    {options.map((opt) => {
      const active = opt.value === value;

      return (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={styles.item}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          accessibilityLabel={opt.label}
        >
          <View style={styles.circleWrap}>
            {active ? (
              <LinearGradient
                colors={gradients.cta}
                start={gradientDirection.diagonal.start}
                end={gradientDirection.diagonal.end}
                style={styles.circle}
              >
                <Feather name={opt.icon} size={rf(19)} color={colors.white} />
              </LinearGradient>
            ) : (
              <View style={[styles.circle, styles.circleIdle]}>
                <Feather name={opt.icon} size={rf(19)} color={colors.textMuted} />
              </View>
            )}

            {opt.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{opt.badge}</Text>
              </View>
            ) : null}
          </View>

          <Text
            variant="label"
            color={active ? 'textPrimary' : 'textMuted'}
            style={styles.label}
            numberOfLines={1}
          >
            {opt.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export const CircleFilters = memo(CircleFiltersComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    // Keeps neighbouring labels from touching when a word is long.
    paddingHorizontal: 4,
  },
  // The `label` variant's tracking makes "FOLLOWERS" wider than its column,
  // so this row tightens it and caps it to one line.
  label: {
    fontSize: rf(9),
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  circleWrap: {
    width: SIZE,
    height: SIZE,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIdle: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Overhangs the circle's top-right corner. `top/right: 0` looked wrong: the
  // circle's edge cuts in ~29% of the radius at 45deg, so a badge flush with
  // the bounding box lands well inside the fill instead of on the rim.
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.screen,
  },
  badgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(9),
    color: colors.white,
  },
});
