import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Header, ListRow, Screen } from '@components/shared';
import { Avatar, Badge, Card, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

interface Conversation {
  id: string;
  initials: string;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  color: string;
  tag?: string;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 'RS',
    initials: 'RS',
    name: 'Riya Sharma',
    preview: 'For the pizza fund! 🍕 Can\'t wait for the Q&A.',
    time: '11:30 AM',
    unread: 2,
    color: colors.primaryDark,
    tag: 'TOP SUPPORTER',
  },
  {
    id: 'KM',
    initials: 'KM',
    name: 'Kabir Mehta',
    preview: 'Are you doing another mixing session this week?',
    time: 'Yesterday',
    color: colors.primaryPressed,
  },
  {
    id: 'AR',
    initials: 'AR',
    name: 'Ananya Rao',
    preview: 'Just followed — loved the last stream!',
    time: 'Aug 16',
    color: colors.warning,
    tag: 'NEW',
  },
];

/** Direct-message inbox. Tapping a row opens the ChatThread modal. */
const MessagesScreen = () => {
  const router = useRouter();

  const openThread = (c: Conversation) =>
    router.push({
      pathname: '/(app)/(modals)/chat-thread',
      params: { followerId: c.id, name: c.name },
    });

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Messages" onBack={() => router.back()} />

      {CONVERSATIONS.length ? (
        <Card style={styles.list}>
          {CONVERSATIONS.map((c, i) => (
            <ListRow
              key={c.id}
              left={<Avatar initials={c.initials} name={c.name} size="lg" color={c.color} />}
              title={c.name}
              subtitle={c.preview}
              divider={i > 0}
              chevron={false}
              onPress={() => openThread(c)}
              right={
                <View style={styles.meta}>
                  <Text variant="caption" color="textMuted" style={styles.time}>
                    {c.time}
                  </Text>
                  {c.unread ? (
                    <View style={styles.unread}>
                      <Text variant="label" color="ctaDark" style={styles.unreadText}>
                        {c.unread}
                      </Text>
                    </View>
                  ) : c.tag ? (
                    <Badge label={c.tag} tone="neutral" />
                  ) : null}
                </View>
              }
            />
          ))}
        </Card>
      ) : (
        <Card>
          <View style={styles.empty}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet."
              description="When a fan messages you, the conversation shows up here."
            />
          </View>
        </Card>
      )}

      <Text variant="caption" color="textMuted" style={styles.note}>
        Replies go straight to the fan — keep them personal.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  list: {
    paddingVertical: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  meta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  time: {
    fontSize: rf(10),
  },
  unread: {
    minWidth: wp(5),
    height: wp(5),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  unreadText: {
    fontSize: rf(9),
    fontFamily: fontFamily.bodySemibold,
  },
  empty: {
    minHeight: wp(45),
    paddingVertical: spacing.lg,
  },
  note: {
    textAlign: 'center',
  },
});

export default MessagesScreen;
