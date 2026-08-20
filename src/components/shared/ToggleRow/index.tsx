import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import {
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ToggleRowProps {
  /** Omit for a bare switch (e.g. a compact table row). */
  label?: string;
  /** Supporting copy under the label. */
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Optional leading Ionicon in a tinted chip. */
  icon?: keyof typeof Feather.glyphMap;
  iconTint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Label (+ description) paired with a Switch. On-tint is the brand lavender
 * so every toggle in the app reads the same.
 */
const ToggleRowComponent = ({
  label,
  description,
  value,
  onValueChange,
  icon,
  iconTint,
  disabled = false,
  style,
}: ToggleRowProps) => (
  <View style={[styles.row, disabled ? styles.disabled : null, style]}>
    {icon ? (
      <View style={styles.iconChip}>
        <Feather
          name={icon}
          size={rf(16)}
          color={iconTint ?? colors.textSecondary}
        />
      </View>
    ) : null}

    {/* Only claim horizontal space when there is text to show — an empty
        label would otherwise stretch the row. */}
    {label || description ? (
      <View style={styles.body}>
        {label ? (
          <Text variant="link" color="textPrimary">
            {label}
          </Text>
        ) : null}
        {description ? (
          <Text variant="caption" color="textSecondary">
            {description}
          </Text>
        ) : null}
      </View>
    ) : null}

    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
      thumbColor={colors.white}
      accessibilityLabel={label}
      accessibilityHint={description}
    />
  </View>
);

export const ToggleRow = memo(ToggleRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.iconChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  disabled: {
    opacity: 0.5,
  },
});
