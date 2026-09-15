import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PageHeader, Screen, SkeletonRows } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { useConversations } from '@hooks/usePrivateMessages';
import type { ArtistConversationSummary } from '@app-types/api';
import { colors, fontFamily, layout } from '@theme';
import { rf } from '@utils/responsive';

const AVATAR_COLORS = [colors.pink, colors.cyan, colors.gold];

function colorFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/** Fan inbox — every conversation, newest first (live). */
const MessagesScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useConversations();
  const conversations = data ?? [];
  const unread = conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0);

  const openThread = (c: ArtistConversationSummary) => {
    router.push({
      pathname: '/(app)/(modals)/chat-thread',
      params: {
        userId: c.userId,
        name: c.userDisplayName ?? 'Fan',
        avatarUrl: c.userAvatarUrl ?? '',
      },
    });
  };

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={
        <PageHeader
          title="Messages"
          onBack={() => router.back()}
          right={
            unread ? (
              <View style={styles.headBadge}>
                <Text style={styles.headBadgeText}>{unread}</Text>
              </View>
            ) : undefined
          }
        />
      }
    >
      {isLoading && conversations.length === 0 ? (
        <SkeletonRows count={6} style={styles.skeleton} />
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLg" color="textPrimary" style={styles.emptyTitle}>
            No messages yet
          </Text>
          <Text variant="bodySm" color="textMuted" style={styles.emptyHint}>
            When a fan messages you, the conversation shows up here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {conversations.map((c, i) => {
            const name = c.userDisplayName ?? 'Fan';
            const preview = `${c.lastMessageSenderType === 'artist' ? 'You: ' : ''}${c.lastMessageText ?? ''}`;
            return (
              <Pressable
                key={c.userId}
                style={[styles.row, i === 0 ? null : styles.rowDivider]}
                onPress={() => openThread(c)}
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
          })}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  headBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  headBadgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    color: colors.white,
  },
  center: {
    marginTop: 80,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  skeleton: {
    marginTop: 16,
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
  },
  emptyHint: {
    textAlign: 'center',
  },
  list: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
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
    fontFamily: fontFamily.extrabold,
    fontSize: rf(9),
    color: colors.white,
  },
});

export default MessagesScreen;
