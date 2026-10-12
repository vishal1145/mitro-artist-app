import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Skeleton } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { useProfile } from '@hooks/useProfile';
import { useConversations } from '@hooks/usePrivateMessages';
import { privateMessageApi } from '@services/api';
import {
  privateMessageHub,
  type PrivateMessageReceivedPayload,
  type PrivateMessageDeletedPayload,
} from '@services/realtime/privateMessageHub';
import { privateMessageInboxHub } from '@services/realtime/privateMessageInboxHub';
import type { ArtistConversationSummary, PrivateMessageItem } from '@app-types/api';
import { colors, fontFamily, gradientDirection, gradients, layout, radius, typography } from '@theme';
import { rf } from '@utils/responsive';

const POLL_MS = 10000;

/** Prefix `handleSend` gives the placeholder it echoes into the thread. */
const PENDING_PREFIX = 'temp-';
const isPendingId = (id: string): boolean => id.startsWith(PENDING_PREFIX);

/**
 * How far apart a placeholder and its server copy may be timestamped and still
 * count as the same message. Generous, because the placeholder is stamped with
 * the device clock and the server row with the server's — but harmless, since
 * a match also requires a placeholder that is still un-reconciled.
 */
const PENDING_MATCH_WINDOW_MS = 5 * 60_000;

/**
 * The placeholder in `prev` that `m` is the confirmed version of, if any.
 *
 * Same sender, same text, same reply target (when the incoming row carries one
 * — the realtime payload doesn't), sent at roughly the same moment.
 */
function pendingTwinOf(
  byId: Map<string, PrivateMessageItem>,
  m: PrivateMessageItem,
): string | null {
  if (isPendingId(m.id) || byId.has(m.id)) return null;
  const at = new Date(m.createdAtUtc).getTime();
  for (const [key, existing] of byId) {
    if (!isPendingId(key)) continue;
    if (existing.senderType !== m.senderType) continue;
    if (existing.messageText !== m.messageText) continue;
    if (
      m.replyToMessageId != null &&
      existing.replyToMessageId != null &&
      m.replyToMessageId !== existing.replyToMessageId
    ) {
      continue;
    }
    if (Math.abs(at - new Date(existing.createdAtUtc).getTime()) > PENDING_MATCH_WINDOW_MS) {
      continue;
    }
    return key;
  }
  return null;
}

/**
 * Merge by id, and retire a placeholder the moment its server copy shows up.
 *
 * A sent message reaches this thread from three places — the `reply` response,
 * the realtime hub echo, and the 10s poll — and the last two carry the real id
 * while the placeholder is still on screen. Keying on id alone therefore left
 * both rows rendered until the `reply` promise resolved and removed the
 * placeholder by id, which is the flicker you see on a reply to a tagged
 * message (that round trip is the slowest, so the window is widest).
 *
 * Reconciling here means whichever source lands first swaps the placeholder
 * out in place. The placeholder is used as the base of the merged row so the
 * quoted-reply header survives: the hub payload has no `replyTo*` fields, so
 * taking the incoming row alone would drop the quote until the next poll.
 */
function mergeMessages(prev: PrivateMessageItem[], incoming: PrivateMessageItem[]): PrivateMessageItem[] {
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) {
    const twin = pendingTwinOf(byId, m);
    const base = twin ? byId.get(twin) : byId.get(m.id);
    if (twin) byId.delete(twin);
    byId.set(m.id, { ...(base ?? {}), ...m });
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime(),
  );
}

function bubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

type Entry =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'msg'; id: string; msg: PrivateMessageItem };

function buildEntries(messages: PrivateMessageItem[]): Entry[] {
  const out: Entry[] = [];
  let last: string | null = null;
  for (const m of messages) {
    const k = dayKey(m.createdAtUtc);
    if (k !== last) {
      out.push({ kind: 'date', id: `d-${k}`, label: dayLabel(m.createdAtUtc) });
      last = k;
    }
    out.push({ kind: 'msg', id: m.id, msg: m });
  }
  return out;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function toast(text1: string): void {
  Toast.show({ type: 'appNotification', text1, props: { type: 'system' } });
}

/**
 * Alternating left/right placeholder bubbles for the opening load — mirrors the
 * web thread's skeleton (`pmsg-bubble-row` shimmer blocks) rather than a spinner.
 */
const SKELETON_BUBBLES: { out: boolean; width: `${number}%` }[] = [
  { out: false, width: '55%' },
  { out: true, width: '48%' },
  { out: false, width: '68%' },
  { out: true, width: '40%' },
  { out: false, width: '60%' },
  { out: true, width: '50%' },
];

/** 1:1 conversation with a fan — live, with reply / copy / forward / edit / delete. */
const ChatThreadScreen = () => {
  const router = useRouter();
  const { userId, name, avatarUrl } = useLocalSearchParams<{
    userId?: string;
    name?: string;
    avatarUrl?: string;
  }>();
  const fan = name ?? 'Fan';
  const firstName = fan.split(' ')[0];

  const { data: profile } = useProfile();
  const artistId = profile?.id;

  const [messages, setMessages] = useState<PrivateMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<PrivateMessageItem | null>(null);
  const [editing, setEditing] = useState<PrivateMessageItem | null>(null);
  const [actionTarget, setActionTarget] = useState<PrivateMessageItem | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<PrivateMessageItem | null>(null);
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const scrollRef = useRef<FlatList<Entry>>(null);

  /*
   * Keyboard: the app is edge-to-edge, so even in `resize` mode Android does
   * not shrink the window for the IME — it only reports its height. The
   * KeyboardAvoidingView padding below is therefore the one thing that moves
   * the composer, on both platforms. (`pan` mode must stay off: with it the
   * system ALSO slid the window, and the two stacked into a large gap.)
   */


  const inputRef = useRef<TextInput>(null);
  const mounted = useRef(true);
  const sendingRef = useRef(false);
  const initialScrollDone = useRef(false);

  /**
   * Native layout keeps settling for a beat after onContentSizeChange first
   * fires — KeyboardAvoidingView padding, avatar loads, date-pill sizing —
   * so a single scrollToEnd can land short of the real bottom (the thread
   * opening "somewhere in the middle" instead of on the latest message).
   * Nudging again next frame and after a short delay reliably closes the gap.
   */
  const nudgeScroll = useCallback((animated: boolean) => {
    // Inverted list: offset 0 is the newest message.
    requestAnimationFrame(() => scrollRef.current?.scrollToOffset({ offset: 0, animated }));
    setTimeout(() => scrollRef.current?.scrollToOffset({ offset: 0, animated }), 200);
  }, []);

  const { data: convData } = useConversations();
  const otherConvos = (convData ?? []).filter((c) => c.userId !== userId);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const flashError = useCallback((msg: string) => {
    if (!mounted.current) return;
    setError(msg);
    setTimeout(() => mounted.current && setError(null), 4000);
  }, []);

  const load = useCallback(
    async (markRead: boolean, dropId?: string) => {
      if (!userId) return;
      const res = await privateMessageApi.getConversation(userId, 1, 50);
      if (!mounted.current) return;
      if (res.success) {
        setMessages((prev) => {
          const base = dropId ? prev.filter((m) => m.id !== dropId) : prev;
          return mergeMessages(base, res.data.items);
        });
        if (markRead) privateMessageApi.markRead(userId);
      }
      setLoading(false);
      if (!initialScrollDone.current) {
        initialScrollDone.current = true;
        nudgeScroll(false);
      }
    },
    [userId, nudgeScroll],
  );

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Suppress the app-wide "new message" toast for the fan whose chat is open.
  useEffect(() => {
    if (!userId) return;
    privateMessageInboxHub.setOpenChat(userId);
    return () => privateMessageInboxHub.setOpenChat(null);
  }, [userId]);

  useEffect(() => {
    if (!artistId || !userId) return;
    let cancelled = false;
    const onMessage = (p: PrivateMessageReceivedPayload) => {
      if (cancelled) return;
      setMessages((prev) =>
        mergeMessages(prev, [
          {
            id: p.id,
            senderType: p.senderType,
            messageText: p.messageText,
            privateCallId: p.privateCallId,
            priceCharged: p.priceCharged,
            readAtUtc: null,
            createdAtUtc: p.createdAtUtc,
          },
        ]),
      );
      // Scroll for any incoming realtime message (including the artist's own
      // sends echoed back from another session) — not just fan messages.
      // Read-receipts stay scoped to the fan's messages only.
      nudgeScroll(true);
      if (p.senderType === 'user') {
        privateMessageApi.markRead(userId);
      }
    };
    const onDeleted = (p: PrivateMessageDeletedPayload) => {
      if (cancelled) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === p.messageId ? { ...m, isDeleted: true, messageText: '' } : m)),
      );
    };
    privateMessageHub.connect(artistId, userId, onMessage, onDeleted);
    return () => {
      cancelled = true;
      privateMessageHub.disconnect();
    };
  }, [artistId, userId, nudgeScroll]);

  const startReply = (m: PrivateMessageItem) => {
    setEditing(null);
    setReplyingTo(m);
    setActionTarget(null);
    inputRef.current?.focus();
  };
  const startEdit = (m: PrivateMessageItem) => {
    setReplyingTo(null);
    setEditing(m);
    setDraft(m.messageText);
    setActionTarget(null);
    inputRef.current?.focus();
  };
  const cancelMode = () => {
    setReplyingTo(null);
    if (editing) setDraft('');
    setEditing(null);
  };

  const handleCopy = async (m: PrivateMessageItem) => {
    setActionTarget(null);
    await Clipboard.setStringAsync(m.messageText);
    toast('Copied to clipboard');
  };

  const confirmDeleteForEveryone = (m: PrivateMessageItem) => {
    setActionTarget(null);
    Alert.alert('Delete for everyone?', 'This removes the message for both of you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Optimistic change
          const backup = messages;
          setMessages((prev) =>
            prev.map((x) => (x.id === m.id ? { ...x, isDeleted: true, messageText: '' } : x)),
          );
          const res = await privateMessageApi.deleteMessage(m.id);
          if (res.success) await load(false);
          else {
            setMessages(backup);
            flashError(res.error);
          }
        },
      },
    ]);
  };

  const confirmDeleteForMe = (m: PrivateMessageItem) => {
    setActionTarget(null);
    Alert.alert('Delete for me?', 'This hides the message from your view only.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Optimistic change
          const backup = messages;
          setMessages((prev) => prev.filter((x) => x.id !== m.id));
          const res = await privateMessageApi.deleteMessageForMe(m.id);
          if (res.success) await load(false);
          else {
            setMessages(backup);
            flashError(res.error);
          }
        },
      },
    ]);
  };

  const confirmDeleteChat = () => {
    Alert.alert('Delete chat?', 'This hides the entire conversation from your view only.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          const res = await privateMessageApi.deleteConversation(userId);
          if (res.success) router.back();
          else flashError(res.error);
        },
      },
    ]);
  };

  const openForward = (m: PrivateMessageItem) => {
    setActionTarget(null);
    setForwardMsg(m);
    setForwardOpen(true);
  };

  const forwardTo = async (c: ArtistConversationSummary) => {
    if (!forwardMsg) return;
    setForwardingId(c.userId);
    const res = await privateMessageApi.reply(c.userId, forwardMsg.messageText);
    if (mounted.current) {
      setForwardingId(null);
      if (res.success) {
        setForwardOpen(false);
        toast(`Forwarded to ${c.userDisplayName ?? 'fan'}`);
      } else {
        flashError(res.error);
      }
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    // sendingRef is a plain ref (not state), so it's already true for a
    // same-tick double-tap even before React re-renders the disabled button —
    // that race is what let a fast double-tap through and posted the same
    // reply twice ("shows in two places").
    if (!text || sendingRef.current || !userId) return;
    const isEditing = editing;
    const replyTarget = replyingTo;

    sendingRef.current = true;
    setSending(true);

    if (isEditing) {
      try {
        const res = await privateMessageApi.editMessage(isEditing.id, text);
        if (!mounted.current) return;
        if (res.success) {
          setDraft('');
          setEditing(null);
          await load(false);
          nudgeScroll(true);
        } else {
          flashError(res.error);
        }
      } catch {
        // Previously uncaught — a thrown error (vs. a Result failure) skipped
        // straight past setSending(false), leaving the send button spinning
        // forever ("gol gol ghumta rehta hai").
        flashError('Could not save the edit. Check your connection and try again.');
      } finally {
        sendingRef.current = false;
        if (mounted.current) setSending(false);
      }
      return;
    }

    // New message: echo it into the thread the instant you hit send instead
    // of waiting on a full round trip — this is what "smooth" was missing.
    // It's reconciled with the server's real id below, in place, so it never
    // shows twice.
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: PrivateMessageItem = {
      id: tempId,
      senderType: 'artist',
      messageText: text,
      privateCallId: null,
      priceCharged: 0,
      readAtUtc: null,
      createdAtUtc: new Date().toISOString(),
      replyToMessageId: replyTarget?.id ?? null,
      replyToText: replyTarget?.messageText ?? null,
      replyToSenderType: replyTarget?.senderType ?? null,
    };
    setMessages((prev) => mergeMessages(prev, [optimistic]));
    setDraft('');
    setReplyingTo(null);
    nudgeScroll(true);

    try {
      const res = await privateMessageApi.reply(userId, text, replyTarget?.id ?? null);
      if (!mounted.current) return;

      if (res.success) {
        const real = res.data;
        // One code path: `mergeMessages` retires the placeholder itself, the
        // same way it does when the hub echo or the poll gets here first.
        setMessages((prev) =>
          mergeMessages(prev, [
            { ...optimistic, id: real.messageId, createdAtUtc: real.createdAtUtc },
          ]),
        );
        void load(false);
        nudgeScroll(true);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setDraft(text);
        setReplyingTo(replyTarget);
        flashError(res.error);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(text);
      setReplyingTo(replyTarget);
      flashError('Could not send. Check your connection and try again.');
    } finally {
      sendingRef.current = false;
      if (mounted.current) setSending(false);
    }
  };

  const entriesReversed = useMemo(() => buildEntries(messages).reverse(), [messages]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
        <Avatar
          uri={avatarUrl || undefined}
          initials={initialsFor(fan)}
          name={fan}
          size="md"
          color={colors.surfaceHover}
        />
        <Text variant="body" color="textPrimary" style={styles.headerName} numberOfLines={1}>
          {fan}
        </Text>
        <Pressable onPress={() => setOptionsOpen(true)} style={styles.backBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Chat options">
          <Feather name="more-vertical" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        {loading && messages.length === 0 ? (
          <View style={[styles.flex, styles.thread]}>
            <View style={styles.skeletonThread}>
              {SKELETON_BUBBLES.map((b, i) => (
                <View
                  key={i}
                  style={[styles.skeletonRow, b.out ? styles.skeletonRight : styles.skeletonLeft]}
                >
                  <Skeleton width={b.width} height={44} round={radius.card} />
                </View>
              ))}
            </View>
          </View>
        ) : messages.length === 0 ? (
          <View style={[styles.flex, styles.center]}>
            <Text variant="bodyLg" color="textPrimary" style={styles.emptyTitle}>
              Say hi to {firstName}
            </Text>
            <Text variant="bodySm" color="textMuted" style={styles.emptyHint}>
              Your replies are free.
            </Text>
          </View>
        ) : (
          /*
           * Inverted, like Telegram: the newest message sits at offset 0 at the
           * bottom, so opening the keyboard or sending never leaves the latest
           * bubble hidden behind the composer.
           */
          <FlatList
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.thread}
            data={entriesReversed}
            inverted
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={Gap}
            renderItem={({ item: e }) =>
              e.kind === 'date' ? (
                <View style={styles.dateWrap}>
                  <View style={styles.datePill}>
                    <Text variant="bodySm" color="textMuted">
                      {e.label}
                    </Text>
                  </View>
                </View>
              ) : (
                <MessageRow
                  msg={e.msg}
                  fan={firstName}
                  onLongPress={() => !e.msg.isDeleted && setActionTarget(e.msg)}
                />
              )
            }
          />
        )}

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
            placeholder={editing ? 'Edit your message…' : 'Write a free reply…'}
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
            accessibilityLabel="Message"
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnOff]}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Save message' : 'Send reply'}
          >
            <LinearGradient colors={gradients.primary} start={gradientDirection.diagonal.start} end={gradientDirection.diagonal.end} style={styles.sendFill}>
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Feather name={editing ? 'check' : 'send'} size={rf(15)} color={colors.text} />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Long-press action sheet */}
      <Modal visible={!!actionTarget} transparent animationType="fade" onRequestClose={() => setActionTarget(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setActionTarget(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
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
          </Pressable>
        </Pressable>
      </Modal>

      {/* Forward picker */}
      <Modal visible={forwardOpen} transparent animationType="slide" onRequestClose={() => setForwardOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setForwardOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.forwardHead}>
              <Text variant="bodyLg" color="textPrimary" style={styles.headerName}>
                Forward to…
              </Text>
              <Pressable onPress={() => setForwardOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <Feather name="x" size={rf(20)} color={colors.textMuted} />
              </Pressable>
            </View>
            {otherConvos.length === 0 ? (
              <Text variant="bodySm" color="textMuted" style={styles.forwardEmpty}>
                No other conversations to forward to yet.
              </Text>
            ) : (
              <ScrollView style={styles.forwardList}>
                {otherConvos.map((c) => {
                  const cname = c.userDisplayName ?? 'Fan';
                  return (
                    <Pressable key={c.userId} style={styles.forwardRow} onPress={() => forwardTo(c)} disabled={forwardingId !== null}>
                      {c.userAvatarUrl ? (
                        <Image source={{ uri: c.userAvatarUrl }} style={styles.forwardAvatar} />
                      ) : (
                        <Avatar initials={initialsFor(cname)} name={cname} size="md" color={colors.cyan} />
                      )}
                      <Text variant="bodyLg" color="textPrimary" style={styles.flex} numberOfLines={1}>
                        {cname}
                      </Text>
                      {forwardingId === c.userId ? (
                        <ActivityIndicator size="small" color={colors.pink} />
                      ) : (
                        <Feather name="send" size={rf(16)} color={colors.textMuted} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header options sheet */}
      <Modal visible={optionsOpen} transparent animationType="fade" onRequestClose={() => setOptionsOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOptionsOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <ActionRow icon="trash-2" label="Delete chat" destructive onPress={() => { setOptionsOpen(false); confirmDeleteChat(); }} />
            <ActionRow icon="x" label="Cancel" onPress={() => setOptionsOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const ActionRow = ({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) => (
  <Pressable style={styles.actionRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
    <Feather name={icon} size={rf(18)} color={destructive ? colors.pink : colors.textPrimary} />
    <Text variant="bodyLg" color={destructive ? 'pink' : 'textPrimary'}>
      {label}
    </Text>
  </Pressable>
);

/**
 * CSS `linear-gradient(135deg, …)` on a w×h box: the gradient line runs through
 * the centre at 45° and is sized so the corners hit the end colours. RN's
 * (0,0)→(1,1) is corner-to-corner instead, which on a wide, short bubble ramps
 * almost horizontally and ends up far more violet than the web.
 */
const BubbleGradient = ({ size }: { size: { w: number; h: number } | null }) => {
  const w = size?.w ?? 1;
  const h = size?.h ?? 1;
  const total = w + h;
  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: (w - h) / 4 / w, y: (h - w) / 4 / h }}
      end={{ x: (3 * w + h) / 4 / w, y: (3 * h + w) / 4 / h }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      locations={total > 2 ? undefined : [0, 1]}
    />
  );
};

const Gap = () => <View style={styles.gap} />;

const MessageRow = ({
  msg,
  fan,
  onLongPress,
}: {
  msg: PrivateMessageItem;
  fan: string;
  onLongPress: () => void;
}) => {
  const out = msg.senderType === 'artist';
  const deleted = !!msg.isDeleted;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <View style={out ? styles.outWrap : styles.inWrap}>
      <Pressable
        onLongPress={onLongPress}
        disabled={deleted}
        delayLongPress={250}
        style={[styles.bubble, out ? styles.bubbleOut : styles.bubbleIn]}
        onLayout={(e) =>
          setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        {out ? <BubbleGradient size={size} /> : null}
        {msg.replyToText != null && !deleted ? (
          <View style={[styles.quote, out ? styles.quoteOut : null]}>
            <Text style={styles.quoteWho} numberOfLines={1}>
              {msg.replyToSenderType === 'artist' ? 'You' : fan}
            </Text>
            <Text style={styles.quoteText} numberOfLines={2}>
              {msg.replyToText || 'message'}
            </Text>
          </View>
        ) : null}
        {deleted ? (
          <View style={styles.deletedRow}>
            <Feather name="trash-2" size={rf(12)} color={colors.textMuted} />
            <Text style={styles.deletedText}>This message was deleted</Text>
          </View>
        ) : (
          <Text style={styles.bubbleText}>{msg.messageText}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, out ? styles.metaTextOut : null]}>
            {bubbleTime(msg.createdAtUtc)}
            {msg.editedAtUtc && !deleted ? ' • edited' : ''}
            {/* Fans pay to message; replies are free — only a fan's bubble shows its cost. */}
            {!out && !deleted && msg.priceCharged > 0 ? ` • ${msg.priceCharged} coins` : ''}
          </Text>
          {out && !deleted ? (
            <Feather
              name={isPendingId(msg.id) ? 'clock' : msg.readAtUtc ? 'check-circle' : 'check'}
              size={rf(12)}
              color={colors.text}
              style={msg.readAtUtc ? undefined : styles.tickSent}
            />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundDeep },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerName: { flex: 1, fontFamily: fontFamily.bold },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thread: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  gap: { height: 4 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 60 },
  skeletonThread: { gap: 12 },
  skeletonRow: { flexDirection: 'row' },
  skeletonLeft: { justifyContent: 'flex-start' },
  skeletonRight: { justifyContent: 'flex-end' },
  emptyTitle: { fontFamily: fontFamily.bold },
  emptyHint: { textAlign: 'center' },

  dateWrap: { alignItems: 'center', marginVertical: 12 },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHover,
  },

  inWrap: { alignSelf: 'flex-start', maxWidth: '88%' },
  outWrap: { alignSelf: 'flex-end', maxWidth: '88%', alignItems: 'flex-end' },
  bubble: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  bubbleIn: { backgroundColor: colors.surfaceSoft, borderBottomLeftRadius: 4 },
  bubbleOut: { borderBottomRightRadius: 4 },
  bubbleText: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deletedText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 14, fontStyle: 'italic' },
  quote: {
    backgroundColor: colors.chipSurface,
    borderLeftColor: colors.pink,
    borderLeftWidth: 3,
    borderRadius: 4,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quoteOut: {},
  quoteWho: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 12 },
  quoteText: { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, marginTop: 2 },
  metaText: { color: colors.textDim, fontFamily: fontFamily.regular, fontSize: 12 },
  tickSent: { opacity: 0.75 },
  metaTextOut: { color: colors.text, opacity: 0.85 },

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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    ...typography.input,
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.text,
  },
  sendBtn: { height: 44, width: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnOff: { opacity: 0.5 },
  sendFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.text, fontFamily: fontFamily.medium, fontSize: 14 },

  sheetBackdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
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
