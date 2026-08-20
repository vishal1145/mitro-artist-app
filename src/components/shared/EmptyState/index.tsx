import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@components/ui/Button';
import { Text } from '@components/ui/Text';
import { colors, spacing } from '@theme';
import { rf } from '@utils/responsive';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  /** Reuse for the "error" async state with a retry action. */
  variant?: 'empty' | 'error';
}

/** Covers the async "empty" and "error" states with an optional action. */
const EmptyStateComponent = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  variant = 'empty',
}: EmptyStateProps) => {
  const resolvedIcon: keyof typeof Feather.glyphMap =
    icon ?? (variant === 'error' ? 'alert-circle' : 'inbox');

  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Feather
          name={resolvedIcon}
          size={rf(40)}
          color={variant === 'error' ? colors.error : colors.textMuted}
        />
      </View>
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="textMuted" align="center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant={variant === 'error' ? 'primary' : 'secondary'}
          fullWidth={false}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

export const EmptyState = memo(EmptyStateComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  action: {
    marginTop: spacing.lg,
  },
});
