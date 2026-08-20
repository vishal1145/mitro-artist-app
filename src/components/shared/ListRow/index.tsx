import { Feather } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing, HIT_TARGET } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading Ionicon, rendered inside a tinted chip. Ignored if `left` is set. */
  icon?: keyof typeof Feather.glyphMap;
  /** Tint for the leading icon. Defaults to secondary text. */
  iconTint?: string;
  /** Custom leading node (e.g. an <Avatar />) — takes precedence over `icon`. */
  left?: ReactNode;
  /** Convenience trailing value text. Ignored if `right` is set. */
  value?: string;
  /** Color token for `value`. */
  valueColor?: keyof typeof colors;
  /** Custom trailing node (e.g. a <Badge /> or switch). */
  right?: ReactNode;
  /** Show a trailing chevron. Defaults to true when `onPress` is provided. */
  chevron?: boolean;
  onPress?: () => void;
  /** Hairline rule along the top edge, for stacked rows. */
  divider?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Generic list row: [leading slot] title/subtitle [trailing slot][chevron].
 * Becomes a Pressable when `onPress` is supplied, with a 44pt min target.
 */
const ListRowComponent = ({
  title,
  subtitle,
  icon,
  iconTint,
  left,
  value,
  valueColor = 'textPrimary',
  right,
  chevron,
  onPress,
  divider = false,
  disabled = false,
  style,
}: ListRowProps) => {
  const showChevron = chevron ?? Boolean(onPress);

  const body = (
    <View
      style={[
        styles.row,
        divider ? styles.divider : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {left ??
        (icon ? (
          <View style={styles.iconChip}>
            <Feather
              name={icon}
              size={rf(18)}
              color={iconTint ?? colors.textSecondary}
            />
          </View>
        ) : null)}

      <View style={styles.body}>
        <Text variant="link" color="textPrimary" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Wrapper centres the trailing slot. Badge sets alignSelf:'flex-start',
          which would otherwise pin it to the top of the row. */}
      {right || value ? (
        <View style={styles.rightSlot}>
          {right ?? (
            <Text variant="link" color={valueColor}>
              {value}
            </Text>
          )}
        </View>
      ) : null}

      {showChevron ? (
        <Feather name="chevron-right" size={rf(16)} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (!onPress || disabled) {
    return body;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  );
};

export const ListRow = memo(ListRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: HIT_TARGET,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconChip: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.md,
    backgroundColor: colors.iconChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  rightSlot: {
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
