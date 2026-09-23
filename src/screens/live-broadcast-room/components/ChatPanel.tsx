import { Feather } from '@expo/vector-icons';
import type { MutableRefObject } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ActivityRow } from '@components/live';
import { Text } from '@components/ui';
import type { BroadcastActivityItem } from '@app-types/broadcast';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ChatPanelProps {
  activity: BroadcastActivityItem[];
  chatText: string;
  onChangeChatText: (text: string) => void;
  sendingChat: boolean;
  onSend: () => void;
  onClose: () => void;
  chatRef: MutableRefObject<ScrollView | null>;
}

export const ChatPanel = ({ activity, chatText, onChangeChatText, sendingChat, onSend, onClose, chatRef }: ChatPanelProps) => (
  <View style={styles.panelSection}>
    <View style={styles.panelHeader}>
      <Text style={styles.panelHeaderText}>LIVE CHAT</Text>
      <View style={styles.panelHeaderRule} />
      <Pressable style={styles.panelClose} onPress={onClose} hitSlop={8} accessibilityLabel="Close chat">
        <Feather name="x" size={rf(16)} color={colors.textMuted} />
      </Pressable>
    </View>
    <ScrollView ref={chatRef} style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
      {activity.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
          <Text variant="bodyLg" color="textPrimary" style={styles.bold}>It&apos;s quiet in here</Text>
          <Text variant="bodySm" color="textMuted" align="center">Once you&apos;re live, chat, reactions, and reward purchases will show up here as they happen.</Text>
        </View>
      ) : activity.map((item) => <ActivityRow key={item.id} item={item} />)}
    </ScrollView>
    <View style={styles.composeRow}>
      <TextInput style={styles.chatInput} value={chatText} onChangeText={onChangeChatText} placeholder="Say something as the host..." placeholderTextColor={colors.textMuted} onSubmitEditing={onSend} returnKeyType="send" maxLength={300} />
      <Pressable style={styles.sendBtn} onPress={onSend} disabled={!chatText.trim() || sendingChat}>
        {sendingChat ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="send" size={rf(16)} color={colors.white} />}
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  bold: { fontFamily: fontFamily.bold },
  panelSection: { flex: 1, marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.backgroundAlt, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  panelHeaderText: { fontFamily: fontFamily.bold, color: colors.textMuted, fontSize: rf(11), letterSpacing: 1.1 },
  panelHeaderRule: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  panelClose: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  feed: { flex: 1 },
  feedContent: { padding: spacing.sm, gap: spacing.sm },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.xl },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  chatInput: { flex: 1, height: wp(10), backgroundColor: colors.glassSurface, borderRadius: radius.pill, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: rf(13) },
  sendBtn: { width: wp(10), height: wp(10), borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
