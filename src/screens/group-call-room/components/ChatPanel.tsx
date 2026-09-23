import { Feather } from '@expo/vector-icons';
import type { MutableRefObject } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ActivityRow, RoomPanel } from '@components/live';
import { Text } from '@components/ui';
import type { GroupCallActivityItem } from '@app-types/groupCall';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

export interface ChatPanelProps {
  activity: GroupCallActivityItem[];
  chatText: string;
  onChangeChatText: (text: string) => void;
  sendingChat: boolean;
  onSend: () => void;
  onClose: () => void;
  chatRef: MutableRefObject<ScrollView | null>;
}

export const ChatPanel = ({ activity, chatText, onChangeChatText, sendingChat, onSend, onClose, chatRef }: ChatPanelProps) => (
  <RoomPanel title="CALL CHAT" onClose={onClose}>
    <ScrollView ref={chatRef} style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
      {activity.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
          <Text variant="bodyLg" color="textPrimary" style={styles.bold}>It&apos;s quiet in here</Text>
          <Text variant="bodySm" color="textMuted" align="center">Once the call is live, chat, reactions, and reward purchases will show up here as they happen.</Text>
        </View>
      ) : activity.map((item) => <ActivityRow key={item.id} item={item} />)}
    </ScrollView>
    <View style={styles.composeRow}>
      <TextInput style={styles.chatInput} value={chatText} onChangeText={onChangeChatText} placeholder="Say something as the host..." placeholderTextColor={colors.textMuted} onSubmitEditing={onSend} returnKeyType="send" maxLength={300} />
      <Pressable style={styles.sendBtn} onPress={onSend} disabled={!chatText.trim() || sendingChat}>
        {sendingChat ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="send" size={rf(16)} color={colors.white} />}
      </Pressable>
    </View>
  </RoomPanel>
);

const styles = StyleSheet.create({
  bold: { fontFamily: fontFamily.bold },
  feed: { flex: 1 },
  feedContent: { padding: spacing.sm, gap: spacing.sm },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.xl },
  composeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  chatInput: { flex: 1, height: wp(10), backgroundColor: colors.glassSurface, borderRadius: radius.pill, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: rf(13) },
  sendBtn: { width: wp(10), height: wp(10), borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
