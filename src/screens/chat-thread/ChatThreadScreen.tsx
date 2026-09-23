import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius, typography } from '@theme';
import { rf } from '@utils/responsive';

import { useChatThread } from './useChatThread';
import { initialsFor } from './threadFormatting';
import { MessageRow } from './components/MessageRow';
import { ActionRow } from './components/ActionRow';
import { ThreadSkeleton } from './components/ThreadSkeleton';
import { ActionSheetModal } from './components/ActionSheetModal';
import { ForwardPickerModal } from './components/ForwardPickerModal';

/** 1:1 conversation with a fan — live, with reply / copy / forward / edit / delete. UI only; logic in useChatThread(). */
const ChatThreadScreen = () => {
  const {
    fan,
    firstName,
    avatarUrl,
    entries,
    loading,
    messages,
    draft,
    sending,
    error,
    replyingTo,
    editing,
    actionTarget,
    forwardOpen,
    forwardingId,
    optionsOpen,
    otherConvos,
    scrollRef,
    inputRef,
    setDraft,
    setActionTarget,
    setForwardOpen,
    setOptionsOpen,
    goBack,
    startReply,
    startEdit,
    cancelMode,
    handleCopy,
    confirmDeleteForEveryone,
    confirmDeleteForMe,
    confirmDeleteChat,
    openForward,
    forwardTo,
    handleSend,
  } = useChatThread();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.iconBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="chevron-left" size={rf(20)} color={colors.textPrimary} />
        </Pressable>
        <Avatar
          uri={avatarUrl || undefined}
          initials={initialsFor(fan)}
          name={fan}
          size="md"
          color={colors.pink}
        />
        <View style={styles.headerText}>
          <Text variant="bodyLg" color="textPrimary" style={styles.headerName} numberOfLines={1}>
            {fan}
          </Text>
          <Text variant="bodySm" color="textMuted">
            Replies are free
          </Text>
        </View>
        <Pressable onPress={() => setOptionsOpen(true)} style={styles.iconBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Options">
          <Feather name="more-vertical" size={rf(20)} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {loading && messages.length === 0 ? (
            <ThreadSkeleton />
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <Text variant="bodyLg" color="textPrimary" style={styles.emptyTitle}>
                Say hi to {firstName}
              </Text>
              <Text variant="bodySm" color="textMuted" style={styles.emptyHint}>
                Your replies are free.
              </Text>
            </View>
          ) : (
            entries.map((e) =>
              e.kind === 'date' ? (
                <View key={e.id} style={styles.dateWrap}>
                  <View style={styles.datePill}>
                    <Text variant="bodySm" color="textMuted">
                      {e.label}
                    </Text>
                  </View>
                </View>
              ) : (
                <MessageRow
                  key={e.id}
                  msg={e.msg}
                  fan={firstName}
                  onLongPress={() => !e.msg.isDeleted && setActionTarget(e.msg)}
                />
              ),
            )
          )}
        </ScrollView>

        {error ? (
          <View style={styles.errorBar}>
            <Feather name="alert-triangle" size={rf(12)} color={colors.pink} />
            <Text variant="bodySm" color="pink" style={styles.flex} numberOfLines={2}>
              {error}
            </Text>
          </View>
        ) : null}

        {replyingTo || editing ? (
          <View style={styles.contextStrip}>
            <View style={styles.contextAccent} />
            <View style={styles.flex}>
              <Text variant="bodySm" color="pink" style={styles.contextTitle}>
                {editing ? 'Editing message' : `Replying to ${replyingTo?.senderType === 'artist' ? 'yourself' : firstName}`}
              </Text>
              <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                {(editing ?? replyingTo)?.messageText}
              </Text>
            </View>
            <Pressable onPress={cancelMode} hitSlop={8} accessibilityLabel="Cancel">
              <Feather name="x" size={rf(18)} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder={editing ? 'Edit message...' : `Message ${firstName}...`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            accessibilityLabel="Message"
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnOff]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <LinearGradient colors={gradients.cta} start={gradientDirection.diagonal.start} end={gradientDirection.diagonal.end} style={styles.sendFill}>
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Feather name={editing ? 'check' : 'send'} size={rf(17)} color={colors.white} />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Long-press action sheet */}
      <ActionSheetModal visible={!!actionTarget} onClose={() => setActionTarget(null)}>
        {actionTarget ? (
          <>
            <ActionRow icon="corner-up-left" label="Reply" onPress={() => startReply(actionTarget)} />
            <ActionRow icon="copy" label="Copy" onPress={() => handleCopy(actionTarget)} />
            <ActionRow icon="share" label="Forward" onPress={() => openForward(actionTarget)} />
            {actionTarget.senderType === 'artist' && !actionTarget.isDeleted ? (
              <>
                {!actionTarget.readAtUtc ? <ActionRow icon="edit-2" label="Edit" onPress={() => startEdit(actionTarget)} /> : null}
                <ActionRow icon="trash-2" label="Delete for everyone" destructive onPress={() => confirmDeleteForEveryone(actionTarget)} />
                <ActionRow icon="trash" label="Delete for me" destructive onPress={() => confirmDeleteForMe(actionTarget)} />
              </>
            ) : null}
            {actionTarget.senderType === 'user' && !actionTarget.isDeleted ? (
              <ActionRow icon="trash" label="Delete for me" destructive onPress={() => confirmDeleteForMe(actionTarget)} />
            ) : null}
            <ActionRow icon="x" label="Cancel" onPress={() => setActionTarget(null)} />
          </>
        ) : null}
      </ActionSheetModal>

      {/* Forward picker */}
      <ForwardPickerModal
        visible={forwardOpen}
        onClose={() => setForwardOpen(false)}
        otherConvos={otherConvos}
        forwardingId={forwardingId}
        onForward={forwardTo}
      />

      {/* Header options sheet */}
      <ActionSheetModal visible={optionsOpen} onClose={() => setOptionsOpen(false)}>
        <ActionRow icon="trash-2" label="Delete chat" destructive onPress={() => { setOptionsOpen(false); confirmDeleteChat(); }} />
        <ActionRow icon="x" label="Cancel" onPress={() => setOptionsOpen(false)} />
      </ActionSheetModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screen },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1, gap: 2 },
  headerName: { fontFamily: fontFamily.bold },
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
    gap: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 60 },
  skeletonThread: { gap: 12 },
  skeletonRow: { flexDirection: 'row' },
  skeletonLeft: { justifyContent: 'flex-start' },
  skeletonRight: { justifyContent: 'flex-end' },
  emptyTitle: { fontFamily: fontFamily.bold },
  emptyHint: { textAlign: 'center' },

  dateWrap: { alignItems: 'center', marginVertical: 4 },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inWrap: { alignSelf: 'flex-start', maxWidth: '82%' },
  outWrap: { alignSelf: 'flex-end', maxWidth: '82%', alignItems: 'flex-end' },
  bubble: { borderRadius: radius.card, paddingHorizontal: 16, paddingVertical: 13 },
  bubbleIn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleOut: { backgroundColor: colors.textPrimary, borderBottomRightRadius: 6 },
  bubbleText: { lineHeight: rf(18) },
  deletedBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8 },
  deletedText: { fontStyle: 'italic' },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.pink,
    paddingLeft: 8,
    marginBottom: 6,
    opacity: 0.9,
  },
  quoteWho: { fontFamily: fontFamily.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  edited: { fontStyle: 'italic' },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: layout.screenPadding,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    backgroundColor: colors.pinkSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },

  contextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: layout.screenPadding,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.pink },
  contextTitle: { fontFamily: fontFamily.bold },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 10,
    paddingBottom: 12,
  },
  input: {
    ...typography.input,
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
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnOff: { opacity: 0.5 },
  sendFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 12,
  },
  forwardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  forwardEmpty: { textAlign: 'center', paddingVertical: 24 },
  forwardList: { maxHeight: 360 },
  forwardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6 },
  forwardAvatar: { width: 42, height: 42, borderRadius: 21 },
});

export default ChatThreadScreen;
