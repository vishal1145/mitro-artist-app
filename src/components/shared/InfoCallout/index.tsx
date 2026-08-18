import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

export type CalloutTone = 'success' | 'warning' | 'neutral' | 'info';

export interface InfoCalloutProps {
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: CalloutTone;
  children: ReactNode;
  linkLabel?: string;
  onLinkPress?: () => void;
}

const TONE: Record<CalloutTone, { bg: string; border: string; icon: string; link: keyof typeof colors }> = {
  success: { bg: colors.successSoft, border: colors.successBorder, icon: colors.success, link: 'success' },
  warning: { bg: colors.warningSoft, border: colors.warningBorder, icon: colors.warning, link: 'warning' },
  info: { bg: colors.infoSoft, border: colors.infoBorder, icon: colors.info, link: 'info' },
  neutral: { bg: colors.surface, border: colors.border, icon: colors.textSecondary, link: 'primary' },
};

/** Tinted informational box: leading icon + rich body text + optional link. */
const InfoCalloutComponent = ({ icon, tone = 'neutral', children, linkLabel, onLinkPress }: InfoCalloutProps) => {
  const t = TONE[tone];

  return (
    <View style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
      {icon ? <Ionicons name={icon} size={rf(18)} color={t.icon} style={styles.icon} /> : null}
      <View style={styles.body}>
        <Text variant="caption" color="textSecondary">
          {children}
        </Text>
        {linkLabel ? (
          <Pressable onPress={onLinkPress} hitSlop={spacing.xs} accessibilityRole="link" accessibilityLabel={linkLabel}>
            <Text variant="caption" color={t.link} style={styles.link}>
              {linkLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export const InfoCallout = memo(InfoCalloutComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  icon: {
    marginTop: rf(1),
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
