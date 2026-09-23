import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PageHeader, Screen, SkeletonRows } from '@components/shared';
import { Text } from '@components/ui';
import { ConversationRow } from '@screens/profile/messages/components/ConversationRow';
import { MessageSettingsModal } from '@screens/profile/messages/components/MessageSettingsModal';
import { useMessageSettings } from '@screens/profile/messages/useMessageSettings';
import { colors, layout, radius, typography, webColors } from '@theme';
import { rf } from '@utils/responsive';

import { StatusPill } from '@screens/profile/messages/components/StatusPill';

/** Fan inbox — every conversation, newest first (live). */
const MessagesScreen = () => {
  const router = useRouter();

  const {
    conversations,
    isLoading,
    unread,
    loadingSettings,
    acceptsMessages,
    settingsOpen,
    openSettings,
    closeSettings,
    price,
    setPrice,
    saving,
    saveSettings,
    openThread,
  } = useMessageSettings();

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
                onPress={openSettings}
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
                onPress={openSettings}
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
          {conversations.map((c, i) => (
            <ConversationRow
              key={c.userId}
              conversation={c}
              first={i === 0}
              onPress={() => openThread(c)}
            />
          ))}
        </View>
      )}

      <MessageSettingsModal
        visible={settingsOpen}
        acceptsMessages={acceptsMessages}
        loadingSettings={loadingSettings}
        price={price}
        setPrice={setPrice}
        saving={saving}
        onSave={() => void saveSettings(!acceptsMessages)}
        onClose={closeSettings}
      />
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
});

export default MessagesScreen;
