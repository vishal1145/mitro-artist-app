import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, gradientDirection, gradients, radius } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface AuthToggleOption<T extends string> {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface AuthToggleProps<T extends string> {
  options: readonly [AuthToggleOption<T>, AuthToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Two-up auth selector: a bordered pill track with the active half filled by
 * the CTA gradient. Icon + label sit inside each half.
 */
const AuthToggleComponent = <T extends string>({
  options,
  value,
  onChange,
}: AuthToggleProps<T>) => (
  <View style={styles.track}>
    {options.map((option) => {
      const active = option.value === value;

      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={styles.half}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          accessibilityLabel={option.label}
        >
          {active ? (
            <LinearGradient
              colors={gradients.cta}
              start={gradientDirection.horizontal.start}
              end={gradientDirection.horizontal.end}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          <View style={styles.content}>
            <Ionicons
              name={option.icon}
              size={rf(16)}
              color={active ? colors.white : colors.textMuted}
            />
            <Text variant="bodyLg" color={active ? 'white' : 'textMuted'} numberOfLines={1}>
              {option.label}
            </Text>
          </View>
        </Pressable>
      );
    })}
  </View>
);

export const AuthToggle = memo(AuthToggleComponent) as typeof AuthToggleComponent;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: wp(13),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 5,
    gap: 4,
  },
  half: {
    flex: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
