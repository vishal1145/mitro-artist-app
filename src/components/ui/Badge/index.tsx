import { memo, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'error' | 'warning';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONE_BG: Record<BadgeTone, string> = {
  neutral: colors.surfaceElevated,
  primary: colors.primarySoft,
  success: colors.successBg,
  error: colors.errorBg,
  warning: colors.warningBg,
};

const TONE_TEXT: Record<BadgeTone, keyof typeof colors> = {
  neutral: 'textSecondary',
  primary: 'primary',
  success: 'success',
  error: 'error',
  warning: 'warning',
};

/** Compact status label. */
const BadgeComponent = ({
  label,
  tone = 'neutral',
}: BadgeProps) => {
  const toneStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: TONE_BG[tone] }),
    [tone],
  );

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text variant="caption" color={TONE_TEXT[tone]} weight="600">
        {label}
      </Text>
    </View>
  );
};

export const Badge = memo(BadgeComponent);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
