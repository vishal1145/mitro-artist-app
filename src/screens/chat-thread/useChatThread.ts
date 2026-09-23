import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { ScrollView, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';

import { useProfile } from '@hooks/useProfile';
import { useConversations } from '@hooks/usePrivateMessages';
import { privateMessageApi } from '@services/api';
import {
  privateMessageHub,
  type PrivateMessageReceivedPayload,
  type PrivateMessageDeletedPayload,
} from '@services/realtime/privateMessageHub';
import type { ArtistConversationSummary, PrivateMessageItem } from '@app-types/api';

import { buildEntries } from './threadFormatting';
import { mergeMessages } from './messageMerge';
import type { UseChatThreadResult } from './useChatThread.types';

const POLL_MS = 10000;

function toast(text1: string): void {
  Toast.show({ type: 'appNotification', text1, props: { type: 'system' } });
}

/** All chat-thread logic. The screen component renders state; it holds none. */
export const useChatThread = (): UseChatThreadResult => {
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

  const scrollRef = useRef<ScrollView>(null);
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
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated }));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 200);
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

  const entries = buildEntries(messages);
  const goBack = () => router.back();

  return {
    fan,
    firstName,
    avatarUrl: avatarUrl || undefined,
    messages,
    entries,
    loading,
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
  };
};
