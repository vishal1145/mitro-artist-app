import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PageHeader, Screen, SkeletonRows } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { useConversations } from '@hooks/usePrivateMessages';
import { useProfile } from '@hooks/useProfile';
import { queryKeys } from '@constants/queryKeys';
import { privateMessageApi } from '@services/api/privateMessageApi';
import type { ArtistConversationSummary } from '@app-types/api';
import { colors, fontFamily, layout, radius, spacing, typography, webColors } from '@theme';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

const AVATAR_COLORS = [colors.pink, colors.cyan, colors.gold];

function colorFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });
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

  const { data, isLoading } = useConversations();
  const conversations = data ?? [];
  const unread = conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0);

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

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={
        <PageHeader
          title="Messages"
          onBack={() => router.back()}
          right={
            <View style={styles.headRight}>
              {unread ? (
                <View style={styles.headBadge}>
                  <Text style={styles.headBadgeText}>{unread}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => setSettingsOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Message settings"
                style={[styles.gear, acceptsMessages ? styles.gearOn : null]}
              >
                <Feather
                  name="settings"
                  size={rf(17)}
                  color={acceptsMessages ? webColors.green : colors.textPrimary}
                />
              </Pressable>
            </View>
          }
        />
      }
    >
      {/* Title row — the ON/OFF pill sits beside it, as on the web. */}
      <View style={styles.titleRow}>
        <View style={styles.eyebrowRow}>
          <Feather name="message-circle" size={rf(13)} color={webColors.pinkLight} />
          <Text style={styles.eyebrow}>Private Message</Text>
        </View>
        {loadingSettings ? null : <StatusPill on={acceptsMessages} />}
      </View>
      <Text style={styles.pageSub}>
        Fans pay to message you directly — your replies are always free.
      </Text>

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
          {conversations.map((c, i) => {
            const name = c.userDisplayName ?? 'Fan';
            const preview = `${c.lastMessageSenderType === 'artist' ? 'You: ' : ''}${c.lastMessageText ?? ''}`;
            return (
              <Pressable
                key={c.userId}
                style={[styles.row, i === 0 ? null : styles.rowDivider]}
                onPress={() => openThread(c)}
                accessibilityRole="button"
                accessibilityLabel={`Conversation with ${name}`}
              >
                <Avatar
                  uri={c.userAvatarUrl ?? undefined}
                  initials={initialsFor(name)}
                  name={name}
                  size="lg"
                  color={colorFor(c.userId)}
                />

                <View style={styles.rowText}>
                  <Text variant="bodyLg" color="textPrimary" style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text
                    variant="bodySm"
                    color={c.unreadCount ? 'textSecondary' : 'textMuted'}
                    numberOfLines={1}
                  >
                    {preview}
                  </Text>
                </View>

                <View style={styles.rowMeta}>
                  <Text variant="bodySm" color="textMuted">
                    {relativeTime(c.lastMessageAtUtc)}
                  </Text>
                  {c.unreadCount ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>{c.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

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
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    ...typography.badge,
    color: colors.white,
  },
  gear: {
    width: 34,
    height: 34,
    borderRadius: 10,
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

  // Eyebrow + ON/OFF pill + page subtitle
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: {
    ...typography.eyebrow,
    color: webColors.pinkLight,
  },
  pageSub: {
    ...typography.subtitle,
    marginTop: 6,
    color: webColors.textSoft,
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

  list: {
    marginTop: 12,
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
    ...typography.badge,
    color: colors.white,
  },

  // ── Settings sheet ──
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  backdropCenter: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  popup: {
    gap: spacing.md,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: webColors.panelFill,
  },
  popupClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: webColors.chip,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  shield: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
