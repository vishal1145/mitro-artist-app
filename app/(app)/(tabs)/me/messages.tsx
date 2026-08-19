import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { InsightLine, PageHeader, Screen } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

interface Conversation {
  id: string;
  name: string;
  initials: string;
  color: string;
  preview: string;
  /** Fragment of the preview that carries the gift/highlight tint. */
  previewHighlight?: string;
  stamp: string;
  unread?: number;
  isNew?: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 'f_riya',
    name: 'Riya Sharma',
    initials: 'RS',
    color: colors.pink,
    preview: 'For the pizza fund! 🍕 ',
    previewHighlight: "Can't wait for the Q…",
    stamp: '11:30 AM',
    unread: 2,
  },
  {
    id: 'f_kabir',
    name: 'Kabir Mehta',
    initials: 'KM',
    color: colors.cyan,
    preview: 'Are you doing ',
    previewHighlight: 'another mixing session this wee…',
    stamp: 'Yesterday',
  },
  {
    id: 'f_ananya',
    name: 'Ananya Rao',
    initials: 'AR',
    color: colors.gold,
    preview: 'Just followed — ',
    previewHighlight: 'loved the last stream!',
    stamp: 'Aug 16',
    isNew: true,
  },
];

/** Fan inbox — every conversation, newest first. */
const MessagesScreen = () => {
  const router = useRouter();
  const unread = CONVERSATIONS.reduce((n, c) => n + (c.unread ?? 0), 0);

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}>
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

      <InsightLine
        style={styles.insight}
        lead="Replies go straight to the fan"
        tail=" — keep them personal."
      />

      <View style={styles.list}>
        {CONVERSATIONS.map((c, i) => (
          <Pressable
            key={c.id}
            style={[styles.row, i === 0 ? null : styles.rowDivider]}
            onPress={() =>
              router.push({
                pathname: '/(app)/(modals)/chat-thread',
                params: { followerId: c.id, name: c.name },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Conversation with ${c.name}`}
          >
            <Avatar initials={c.initials} name={c.name} size="lg" color={c.color} />

            <View style={styles.rowText}>
              <Text variant="bodyLg" color="textPrimary" style={styles.name}>
                {c.name}
              </Text>
              <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                {c.preview}
                {c.previewHighlight ? (
                  <Text variant="bodySm" color="textSecondary">
                    {c.previewHighlight}
                  </Text>
                ) : null}
              </Text>
            </View>

            <View style={styles.rowMeta}>
              <Text variant="bodySm" color="textMuted">
                {c.stamp}
              </Text>

              {c.unread ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{c.unread}</Text>
                </View>
              ) : null}

              {c.isNew ? (
                <View style={styles.newPill}>
                  <Text variant="label" color="cyan">
                    NEW
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>

      <Text variant="bodySm" color="textMuted" align="center" style={styles.footnote}>
        A 20-second personal reply keeps a supporter for months — copy-paste blasts read cold.{' '}
        <Text variant="bodySm" color="gold" style={styles.footLink}>
          Messaging tips
        </Text>
      </Text>
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
    fontSize: rf(11),
    color: colors.white,
  },

  insight: {
    marginTop: 20,
  },

  list: {
    marginTop: 20,
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
    fontSize: rf(10),
    color: colors.white,
  },
  newPill: {
    borderWidth: 1,
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },

  footnote: {
    marginTop: 26,
    lineHeight: rf(19),
  },
  footLink: {
    fontFamily: fontFamily.bold,
  },
});

export default MessagesScreen;
