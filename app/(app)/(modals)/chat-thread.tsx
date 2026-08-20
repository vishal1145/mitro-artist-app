import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

type Bubble =
  | { id: string; kind: 'in' | 'out'; text: string; at: string }
  | { id: string; kind: 'gift'; amount: string; note: string; at: string };

const THREAD: Bubble[] = [
  {
    id: 'm1',
    kind: 'in',
    text: 'Hey! Loved the stream last night, your energy was insane! 🔥 Have you thought about doing a dedicated Q&A session?',
    at: '10:42 AM',
  },
  {
    id: 'm2',
    kind: 'out',
    text: 'Thank you Riya! Honestly, I was so nervous but chat kept me going. A Q&A is a great idea, maybe this weekend?',
    at: '11:15 AM',
  },
  {
    id: 'm3',
    kind: 'gift',
    amount: '250 coins',
    note: "For the pizza fund! 🍕 Can't wait for the Q&A.",
    at: '11:20 AM',
  },
  {
    id: 'm4',
    kind: 'out',
    text: "You're the best! Pizza stream confirmed for Saturday. I'll make sure to shout you out 🎉",
    at: '11:30 AM',
  },
];

/** 1:1 conversation with a fan, including coin gifts sent inside the thread. */
const ChatThreadScreen = () => {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ followerId?: string; name?: string }>();
  const fan = name ?? 'Riya Sharma';
  const firstName = fan.split(' ')[0];

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={rf(20)} color={colors.textPrimary} />
        </Pressable>

        <Avatar initials="RS" name={fan} size="md" color={colors.pink} />

        <View style={styles.headerText}>
          <Text variant="bodyLg" color="textPrimary" style={styles.headerName} numberOfLines={1}>
            {fan}
          </Text>
          <View style={styles.headerMeta}>
            <Feather name="star" size={rf(11)} color={colors.gold} />
            <Text variant="bodySm" color="textMuted">
              Top Supporter · 12,450 coins
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.iconBtn}
          onPress={() =>
            router.push({
              pathname: '/(app)/(modals)/private-call-room',
              params: { callId: 'call_demo', fan },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Start a video call with ${firstName}`}
        >
          <Feather name="video" size={rf(18)} color={colors.cyan} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {THREAD.map((b) => {
            if (b.kind === 'gift') {
              return (
                <View key={b.id} style={styles.gift}>
                  <View style={styles.giftHead}>
                    <View style={styles.giftIcon}>
                      <Feather name="gift" size={rf(14)} color={colors.gold} />
                    </View>
                    <Text variant="bodyLg" color="gold" style={styles.giftTitle}>
                      {firstName} sent {b.amount}
                    </Text>
                  </View>
                  <Text variant="bodySm" color="textSecondary" style={styles.giftNote}>
                    &quot;{b.note}&quot;
                  </Text>
                </View>
              );
            }

            const out = b.kind === 'out';

            return (
              <View key={b.id} style={out ? styles.outWrap : styles.inWrap}>
                <View style={[styles.bubble, out ? styles.bubbleOut : styles.bubbleIn]}>
                  <Text
                    variant="body"
                    color={out ? 'screen' : 'textPrimary'}
                    style={styles.bubbleText}
                  >
                    {b.text}
                  </Text>
                </View>
                <Text variant="bodySm" color="textMuted" style={styles.stamp}>
                  {b.at}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <Pressable
            style={styles.attachBtn}
            accessibilityRole="button"
            accessibilityLabel="Attach a file"
          >
            <Feather name="paperclip" size={rf(18)} color={colors.textMuted} />
          </Pressable>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Message ${firstName}...`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            accessibilityLabel="Message"
          />

          <Pressable
            onPress={() => setDraft('')}
            disabled={!draft.trim()}
            style={styles.sendBtn}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <LinearGradient
              colors={gradients.cta}
              start={gradientDirection.diagonal.start}
              end={gradientDirection.diagonal.end}
              style={styles.sendFill}
            >
              <Feather name="send" size={rf(17)} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screen,
  },
  flex: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontFamily: fontFamily.bold,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thread: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 18,
    gap: 18,
  },
  inWrap: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
  },
  outWrap: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  bubbleIn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  // Outgoing is a light bubble with dark text — the inverse of incoming.
  bubbleOut: {
    backgroundColor: colors.textPrimary,
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    lineHeight: rf(18),
  },
  stamp: {
    marginTop: 6,
  },

  gift: {
    alignSelf: 'stretch',
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
  },
  giftHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  giftIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTitle: {
    fontFamily: fontFamily.bold,
  },
  giftNote: {
    fontStyle: 'italic',
    lineHeight: rf(17),
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 10,
    paddingBottom: 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(11),
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatThreadScreen;
