import { Feather } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';

import { live } from './liveTokens';

export interface RoomPanelProps {
  /** Uppercase section label, e.g. "LIVE CHAT" / "ACTIVITY". */
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The slide-in panel below a room's video stage (chat, viewers, activity).
 *
 * Same surface the broadcast studio uses: card fill, uppercase header with a
 * hairline rule running to the round close button.
 */
export const RoomPanel = memo(
  ({ title, onClose, children }: RoomPanelProps) => (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{title}</Text>
        <View style={styles.rule} />
        <Pressable
          style={styles.close}
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title.toLowerCase()}`}
        >
          <Feather name="x" size={rf(16)} color={colors.textMuted} />
        </Pressable>
      </View>
      {children}
    </View>
  ),
);
RoomPanel.displayName = 'RoomPanel';

const styles = StyleSheet.create({
  section: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerText: {
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    fontSize: rf(11),
    letterSpacing: 1.1,
  },
  rule: { flex: 1, height: 1, backgroundColor: live.hairline },
  close: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: live.hairline,
  },
});
