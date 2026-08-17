import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, spacing, HIT_TARGET } from '@theme';
import { rf } from '@utils/responsive';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
}

/** Screen header with optional back button and a single right action. */
const HeaderComponent = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
}: HeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconButton}
          >
            <Ionicons
              name="chevron-back"
              size={rf(24)}
              color={colors.textPrimary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titles}>
        <Text variant="h3" align="center" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" align="center" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.sideRight}>
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel ?? 'Action'}
            style={styles.iconButton}
          >
            <Ionicons name={rightIcon} size={rf(22)} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export const Header = memo(HeaderComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  side: {
    width: HIT_TARGET,
    alignItems: 'flex-start',
  },
  sideRight: {
    width: HIT_TARGET,
    alignItems: 'flex-end',
  },
  titles: {
    flex: 1,
  },
  iconButton: {
    minWidth: HIT_TARGET,
    minHeight: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
