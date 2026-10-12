import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ConfirmDialog, PageHeader, Screen, SkeletonRows } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { useConversations } from '@hooks/usePrivateMessages';
import { useDebounce } from '@hooks/useDebounce';
import { useProfile } from '@hooks/useProfile';
import { queryKeys } from '@constants/queryKeys';
import { privateMessageApi } from '@services/api/privateMessageApi';
import type { ArtistConversationSummary } from '@app-types/api';
import { colors, fontFamily, fontSize, layout, radius, spacing, typography, webColors } from '@theme';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Web `formatRelativeTime` — "just now", "5m ago", "3h ago", "5d ago". */
function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** The web's `.pcall-status-pill` — ON is green, OFF is a neutral chip. */
const StatusPill = ({ on }: { on: boolean }) => (
  <View style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
    <Text style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
      {on ? 'ON' : 'OFF'}
    </Text>
  </View>
);

/** Fan inbox — every conversation, newest first (live). */
const MessagesScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);

  const { data, isLoading } = useConversations();
  const conversations = data ?? [];
  const unreadChats = conversations.filter((c) => (c.unreadCount ?? 0) > 0).length;
  const needle = debouncedQuery.trim().toLowerCase();
  const visible = conversations.filter(
    (c) =>
      (tab === 'all' || (c.unreadCount ?? 0) > 0) &&
      (!needle || (c.userDisplayName ?? 'Fan').toLowerCase().includes(needle)),
  );

  /*
   * Accepting messages (and the per-message price) lives on the artist
   * profile — exactly where the web reads it from via `getMe()`. It is only
   * ever written through `privateMessageApi.setSettings`.
   */
  const { data: profile, isLoading: loadingSettings } = useProfile();
  const acceptsMessages = !!profile?.acceptsPrivateMessages;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill from the saved price the way the web does — only when there is one.
  useEffect(() => {
    if (profile?.privateMessagePrice) setPrice(String(profile.privateMessagePrice));
  }, [profile?.privateMessagePrice]);

  /**
   * One button drives both directions, like the web: it sends the *opposite*
   * of the current state. A blank price is left out of the payload entirely.
   */
  const saveSettings = async (nextAccepts: boolean) => {
    if (saving) return;
    setSaving(true);
    const priceValue = price ? Number(price) : undefined;
    const res = await privateMessageApi.setSettings(nextAccepts, priceValue);
    setSaving(false);

    if (!res.success) {
      // No optimistic flip — the switch stays where the backend left it.
      showToast(res.error, 'error');
      return;
    }
    showToast(
      nextAccepts ? 'Private messages turned on.' : 'Private messages turned off.',
      'success',
    );
    setSettingsOpen(false);
    // Re-read the profile so the pill and price reflect what was actually saved.
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
  };

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

  const [deleteTarget, setDeleteTarget] = useState<ArtistConversationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteConversation = (c: ArtistConversationSummary) => setDeleteTarget(c);

  const performDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const res = await privateMessageApi.deleteConversation(deleteTarget.userId);
    setDeleting(false);
    if (res.success) {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list() });
      showToast('Chat deleted.', 'success');
    } else {
      showToast(res.error, 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={
        <PageHeader
          eyebrow="PRIVATE MESSAGE"
          eyebrowIcon="message-circle"
          title="Messages"
          subtitle="Fans pay to message you directly — your replies are always free."
          onBack={() => router.back()}
          titleAdornment={loadingSettings ? null : <StatusPill on={acceptsMessages} />}
          right={
            <Pressable
              onPress={() => setSettingsOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Message settings"
              style={[styles.gear, acceptsMessages ? styles.gearOn : null]}
            >
              <LucideIcon
                name="settings"
                size={rf(18)}
                color={acceptsMessages ? webColors.green : colors.textPrimary}
              />
            </Pressable>
          }
        />
      }
    >
      <View>
        <View style={styles.cardHead}>
          <View style={styles.search}>
            <LucideIcon name="search" size={rf(16)} color={colors.textDim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.textDim}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search conversations"
            />
          </View>
          <View style={styles.tabs}>
            {(['all', 'unread'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                style={[styles.tab, tab === t ? styles.tabOn : null]}
              >
                <Text style={[styles.tabText, tab === t ? styles.tabTextOn : null]}>
                  {t === 'all' ? 'All' : 'Unread'}
                </Text>
                {t === 'unread' && unreadChats > 0 ? (
                  <Text style={styles.tabN}>{unreadChats}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

      {isLoading && conversations.length === 0 ? (
        <SkeletonRows count={6} style={styles.skeleton} />
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Feather name="message-circle" size={rf(28)} color={colors.textMuted} />
          {acceptsMessages ? (
            <Text variant="bodySm" color="textMuted" style={styles.emptyHint}>
              No conversations yet — they&apos;ll show up here the moment a fan messages you.
            </Text>
          ) : (
            <>
              <Text variant="bodySm" color="textMuted" style={styles.emptyHint}>
                Private messages are off, so fans can&apos;t start a conversation with you yet.
              </Text>
              <Pressable
                onPress={() => setSettingsOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Turn on private messages"
                style={styles.emptyCta}
              >
                <Text style={styles.emptyCtaText}>Turn on private messages</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {visible.length === 0 ? <Text style={styles.none}>No matches.</Text> : null}
          {visible.map((c) => {
            const name = c.userDisplayName ?? 'Fan';
            const preview = `${c.lastMessageSenderType === 'artist' ? 'You: ' : ''}${c.lastMessageText ?? ''}`;
            return (
              <Pressable
                key={c.userId}
                style={styles.row}
                onPress={() => openThread(c)}
                onLongPress={() => confirmDeleteConversation(c)}
                delayLongPress={350}
                accessibilityRole="button"
                accessibilityLabel={`Conversation with ${name}. Long press to delete.`}
              >
                {c.userAvatarUrl ? (
                  <Image source={{ uri: c.userAvatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initialsFor(name)}</Text>
                  </View>
                )}

                <View style={styles.rowText}>
                  <View style={styles.line}>
                    <Text style={styles.name} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={[styles.time, c.unreadCount ? styles.timeUnread : null]}>
                      {relativeTime(c.lastMessageAtUtc)}
                    </Text>
                  </View>
                  <View style={styles.line}>
                    <Text
                      style={[styles.preview, c.unreadCount ? styles.previewUnread : null]}
                      numberOfLines={1}
                    >
                      {preview}
                    </Text>
                    {c.unreadCount ? (
                      <View style={styles.unread}>
                        <Text style={styles.unreadText}>{c.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      </View>

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete chat?"
        message={`This removes your entire chat with ${deleteTarget?.userDisplayName || 'this fan'} from your inbox. It stays visible to them.`}
        confirmLabel="Delete"
        confirmLoading={deleting}
        onConfirm={() => void performDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />

      {/*
        Settings — the web's popover, as a centred popup.

        Deliberately NOT a bottom sheet: the price field sits low on a sheet
        and the keyboard covers it the moment it's focused. Centred + keyboard
        avoiding keeps the input and the button visible while typing.
      */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!saving) setSettingsOpen(false);
        }}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close message settings"
          onPress={() => {
            if (!saving) setSettingsOpen(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.backdropCenter}
          >
            {/* Swallow taps inside the card so they don't dismiss it. */}
            <Pressable style={styles.popup} onPress={() => undefined}>
          <View style={styles.sheetHead}>
            <View style={[styles.shield, acceptsMessages ? styles.shieldOn : null]}>
              <Feather
                name="shield"
                size={rf(16)}
                color={acceptsMessages ? webColors.green : colors.textSecondary}
              />
            </View>
            <View style={styles.sheetCopy}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Accept private messages</Text>
                {loadingSettings ? null : <StatusPill on={acceptsMessages} />}
              </View>
              <Text style={styles.sheetSub}>
                Fans pay to send you a message. You can reply for free, any time.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (!saving) setSettingsOpen(false);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.popupClose}
            >
              <Feather name="x" size={rf(15)} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Feather name="dollar-sign" size={rf(13)} color={colors.textMuted} />
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="Price"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                editable={!loadingSettings && !saving}
                accessibilityLabel="Price per message"
                style={styles.input}
              />
              <Text style={styles.suffix}>/msg</Text>
            </View>

            <Pressable
              onPress={() => saveSettings(!acceptsMessages)}
              disabled={saving || loadingSettings}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || loadingSettings, busy: saving }}
              accessibilityLabel={acceptsMessages ? 'Turn off' : 'Turn on'}
              style={[
                styles.cta,
                acceptsMessages ? styles.ctaOff : styles.ctaOn,
                saving || loadingSettings ? styles.ctaDisabled : null,
              ]}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={acceptsMessages ? colors.textPrimary : webColors.onGreen}
                />
              ) : null}
              <Text style={acceptsMessages ? styles.ctaOffText : styles.ctaOnText}>
                {saving ? 'Saving...' : acceptsMessages ? 'Turn off' : 'Turn on'}
              </Text>
            </Pressable>
          </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: webColors.circleBorder,
    backgroundColor: webColors.chip,
  },
  gearOn: {
    borderColor: webColors.greenBorder,
    backgroundColor: webColors.greenChip,
  },

  cardHead: {
    gap: 12,
    marginTop: 12,
  },
  search: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    minWidth: 0,
    paddingVertical: 0,
  },
  tabs: { flexDirection: 'row', gap: 20 },
  tab: {
    alignItems: 'center',
    borderBottomColor: colors.transparent,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  tabOn: { borderBottomColor: colors.pink },
  tabText: { color: colors.textDim, fontFamily: fontFamily.medium, fontSize: fontSize.small },
  tabTextOn: { color: colors.text },
  tabN: { color: colors.textDim, fontFamily: fontFamily.mono, fontSize: fontSize.mono },
  none: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.small,
    paddingHorizontal: 16,
    paddingVertical: 24,
    textAlign: 'center',
  },

  // .pcall-status-pill
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillOn: { backgroundColor: webColors.greenPill, borderColor: webColors.greenRing },
  pillOff: { backgroundColor: webColors.offPill, borderColor: webColors.offPillRing },
  pillText: {
    ...typography.badge,
  },
  pillTextOn: { color: webColors.green },
  pillTextOff: { color: webColors.chipText },

  center: {
    marginTop: 64,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  skeleton: {
    marginTop: 16,
  },
  emptyHint: {
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: webColors.cardBorder,
    backgroundColor: webColors.chip,
  },
  emptyCtaText: {
    ...typography.buttonSm,
    color: webColors.textStrong,
  },

  list: { marginTop: 4 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  avatarText: { color: colors.text, fontFamily: fontFamily.bold, fontSize: fontSize.body },
  rowText: { flex: 1, gap: 4, minWidth: 0 },
  line: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  name: { color: colors.text, flex: 1, fontFamily: fontFamily.bold, fontSize: fontSize.body },
  preview: { color: colors.textMuted, flex: 1, fontFamily: fontFamily.regular, fontSize: fontSize.small },
  previewUnread: { color: colors.text },
  time: { color: colors.textDim, fontFamily: fontFamily.regular, fontSize: fontSize.xs },
  timeUnread: { color: colors.pink },
  unread: {
    alignItems: 'center',
    backgroundColor: colors.pink,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
  },
  unreadText: { ...typography.badge, color: colors.text },

  // ── Settings sheet ──
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  backdropCenter: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  popup: {
    gap: spacing.md,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: colors.backgroundDeep,
  },
  popupClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: webColors.chip,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  shield: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: webColors.cardBorder,
    backgroundColor: webColors.chip,
  },
  shieldOn: {
    borderColor: webColors.greenBorder,
    backgroundColor: webColors.greenChip,
  },
  sheetCopy: { flex: 1, minWidth: 0, gap: 4 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sheetTitle: {
    ...typography.h3,
    color: webColors.textStrong,
  },
  sheetSub: {
    ...typography.bodySm,
    color: webColors.textSoft,
  },

  form: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: webColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: webColors.inputFill,
  },
  input: {
    ...typography.input,
    flex: 1,
    paddingVertical: 0,
    color: webColors.textStrong,
  },
  suffix: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  /** OFF → the web's green "register-submit" primary. */
  ctaOn: { backgroundColor: webColors.green },
  ctaOnText: {
    ...typography.buttonSm,
    color: webColors.onGreen,
  },
  /** ON → the web's neutral "secondary-button". */
  ctaOff: {
    borderWidth: 1,
    borderColor: webColors.cardBorder,
    backgroundColor: webColors.chip,
  },
  ctaOffText: {
    ...typography.buttonSm,
    color: webColors.textStrong,
  },
  ctaDisabled: { opacity: 0.6 },
});

export default MessagesScreen;
