import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, typography } from '@theme';

import { colorFor, initialsFor, relativeTime } from '../formatters';

import type { ArtistConversationSummary } from '@app-types/api';

interface ConversationRowProps {
  conversation: ArtistConversationSummary;
  /** Suppresses the top divider on the first row. */
  first: boolean;
  onPress: () => void;
}

export const ConversationRow = ({ conversation: c, first, onPress }: ConversationRowProps) => {
  const name = c.userDisplayName ?? 'Fan';
  const preview = `${c.lastMessageSenderType === 'artist' ? 'You: ' : ''}${c.lastMessageText ?? ''}`;

  return (
    <Pressable
      style={[styles.row, first ? null : styles.rowDivider]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${name}`}
    >
      <Avatar
        uri={c.userAvatarUrl ?? undefined}
        initials={initialsFor(name)}
        name={name}
        size="lg"
        color={colorFor(c.userId)}
      />

      <View style={styles.rowText}>
        <Text variant="bodyLg" color="textPrimary" style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text
          variant="bodySm"
          color={c.unreadCount ? 'textSecondary' : 'textMuted'}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      <View style={styles.rowMeta}>
        <Text variant="bodySm" color="textMuted">
          {relativeTime(c.lastMessageAtUtc)}
        </Text>
        {c.unreadCount ? (
          <View style={styles.unread}>
            <Text style={styles.unreadText}>{c.unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: fontFamily.bold,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    ...typography.badge,
    color: colors.white,
  },
});
