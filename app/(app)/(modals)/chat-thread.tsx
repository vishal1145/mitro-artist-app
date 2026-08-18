import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type Message =
  | { id: string; kind: 'text'; mine: boolean; body: string; time: string; read?: boolean }
  | { id: string; kind: 'tip'; from: string; coins: string; note: string }
  | { id: string; kind: 'day'; label: string };

const INITIAL: Message[] = [
  { id: 'd1', kind: 'day', label: 'Yesterday' },
  {
    id: 'm1',
    kind: 'text',
    mine: false,
    body: 'Hey! Loved the stream last night, your energy was insane! 🔥 Have you thought about doing a dedicated Q&A session?',
    time: '10:42 AM',
  },
  {
    id: 'm2',
    kind: 'text',
    mine: true,
    body: 'Thank you Riya! Honestly, I was so nervous but chat kept me going. A Q&A is a great idea, maybe this weekend?',
    time: '11:15 AM',
  },
  {
    id: 'm3',
    kind: 'tip',
    from: 'Riya',
    coins: '250',
    note: "For the pizza fund! 🍕 Can't wait for the Q&A.",
  },
  {
    id: 'm4',
    kind: 'text',
    mine: true,
    body: "You're the best! Pizza stream confirmed for Saturday. I'll make sure to shout you out. 🍕✨",
    time: '11:30 AM',
    read: true,
  },
];

const ChatThreadScreen = () => {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ followerId?: string; name?: string }>();
  const fanName = name ?? 'Riya Sharma';

  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const body = draft.trim();
    if (!body) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `m${prev.length + 1}`,
        kind: 'text',
        mine: true,
        body,
        time: 'Now',
      },
    ]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={rf(22)} color={colors.textPrimary} />
        </Pressable>

        <Avatar initials="RS" name={fanName} size="md" style={styles.headerAvatar} />

        <View style={styles.headerText}>
          <Text variant="link" color="textPrimary" numberOfLines={1}>
            {fanName}
          </Text>
          <View style={styles.headerMeta}>
            <Ionicons name="star" size={rf(11)} color={colors.warning} />
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              Top Supporter · 12,450 coins
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.callBtn}
          accessibilityRole="button"
          accessibilityLabel={`Start a call with ${fanName}`}
        >
          <Ionicons name="videocam" size={rf(18)} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Coaching note */}
          <View style={styles.note}>
            <View style={styles.noteAccent} />
            <View style={styles.noteBody}>
              <Ionicons name="information-circle-outline" size={rf(16)} color={colors.primary} />
              <Text variant="caption" color="textSecondary" style={styles.noteText}>
                Keep it personal! {fanName.split(' ')[0]} has been engaging a lot lately. A genuine
                response goes a long way compared to a copy-pasted blast.
              </Text>
            </View>
          </View>

          {messages.map((m) => {
            if (m.kind === 'day') {
              return (
                <View key={m.id} style={styles.dayRow}>
                  <Text variant="label" color="textMuted" style={styles.dayPill}>
                    {m.label}
                  </Text>
                </View>
              );
            }

            if (m.kind === 'tip') {
              return (
                <View key={m.id} style={styles.tipWrap}>
                  <View style={styles.tipCard}>
                    <View style={styles.tipHead}>
                      <View style={styles.tipIcon}>
                        <Ionicons name="gift" size={rf(16)} color={colors.warning} />
                      </View>
                      <Text variant="link" color="warning">
                        {m.from} sent {m.coins} coins
                      </Text>
                    </View>
                    <Text variant="caption" color="textSecondary" style={styles.tipNote}>
                      &quot;{m.note}&quot;
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={m.id}
                style={[styles.bubbleRow, m.mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}
              >
                <View style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text variant="body" color={m.mine ? 'ctaDark' : 'textPrimary'}>
                    {m.body}
                  </Text>
                </View>
                <View style={styles.stamp}>
                  <Text variant="caption" color="textMuted" style={styles.stampText}>
                    {m.time}
                  </Text>
                  {m.mine && m.read ? (
                    <Ionicons name="checkmark-done" size={rf(12)} color={colors.primary} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Composer — pinned above the keyboard */}
        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <Pressable
              hitSlop={spacing.xs}
              accessibilityRole="button"
              accessibilityLabel="Attach a file"
            >
              <Ionicons name="attach" size={rf(20)} color={colors.textSecondary} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${fanName.split(' ')[0]}…`}
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.input}
              multiline
              accessibilityLabel="Message text"
            />
          </View>

          <Pressable
            style={[styles.sendBtn, !draft.trim() ? styles.sendBtnIdle : null]}
            onPress={send}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons
              name="send"
              size={rf(18)}
              color={draft.trim() ? colors.ctaDark : colors.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerAvatar: {
    marginLeft: spacing.xxs,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  callBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thread: {
    padding: spacing.md,
    gap: spacing.lg,
  },

  note: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  noteAccent: {
    width: wp(1),
    backgroundColor: colors.primary,
  },
  noteBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
  },

  dayRow: {
    alignItems: 'center',
  },
  dayPill: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },

  bubbleRow: {
    gap: spacing.xxs,
    maxWidth: '85%',
  },
  bubbleRowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  stampText: {
    fontSize: rf(10),
  },

  tipWrap: {
    alignItems: 'center',
  },
  tipCard: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tipHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipIcon: {
    width: wp(8),
    height: wp(8),
    borderRadius: radius.full,
    backgroundColor: colors.warningChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNote: {
    fontStyle: 'italic',
    paddingLeft: wp(11),
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(14),
    paddingVertical: spacing.sm,
    maxHeight: wp(28),
  },
  sendBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnIdle: {
    backgroundColor: colors.surfaceElevated,
  },
});

export default ChatThreadScreen;
