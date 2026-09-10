import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { EarningsBar, Screen, SectionLabel } from '@components/shared';
import { Text } from '@components/ui';
import { settingsApi } from '@services/api/settingsApi';
import { activeBroadcastStore } from '@services/broadcast/activeBroadcast';
import { useNotificationStore } from '@store';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

// Matches the artist web's Go Live category chips (text-only pills).
const CATEGORIES = ['Music', 'Talk', 'Dance', 'Gaming', 'Art', 'Fitness'];

const CHECKS = ['camera detected', 'mic detected', 'connection looks good'];

/** Live tab — the pre-flight "Let's get your stream ready" setup, matched to
 * the artist web's Go Live screen. */
const GoLiveScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);

  // Empty by default — the artist fills these in, exactly like the web.
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Music');
  const [description, setDescription] = useState('');
  const [highlightedPrice, setHighlightedPrice] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [activeRewards, setActiveRewards] = useState<number | null>(null);
  const [resumable, setResumable] = useState(false);

  useEffect(() => {
    settingsApi.getRewardMenu().then((res) => {
      if (res.success) setActiveRewards(res.data.filter((r) => r.isActive).length);
    });
  }, []);

  // Re-check on every focus: if the artist backed out of a live broadcast, the
  // CTA becomes "Resume live broadcast" so they can jump back into the same one.
  useFocusEffect(
    useCallback(() => {
      activeBroadcastStore.get().then((a) => setResumable(!!a));
    }, []),
  );

  const priceValid = highlightedPrice.trim().length > 0 && Number(highlightedPrice) > 0;
  const canGoLive = resumable || (title.trim().length > 0 && priceValid);

  const goLive = () => {
    if (resumable) {
      // Room detects the persisted broadcast and rejoins it — no new config.
      router.push({ pathname: '/(app)/(modals)/live-broadcast-room' });
      return;
    }
    if (!canGoLive) return;
    router.push({
      pathname: '/(app)/(modals)/live-broadcast-room',
      params: {
        sessionConfig: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          highlightedMessagePrice: highlightedPrice ? Number(highlightedPrice) : undefined,
        }),
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
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread={hasUnread}
        />
      }
    >
      {/* Header eyebrow + title (web: "BEFORE YOU GO LIVE / Let's get your stream ready") */}
      <View style={styles.eyebrowRow}>
        <Feather name="map-pin" size={rf(12)} color={colors.pink} />
        <Text variant="label" color="pink">
          BEFORE YOU GO LIVE
        </Text>
      </View>
      <Text variant="h1" style={styles.title}>
        Let&apos;s get your stream ready
      </Text>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={styles.previewTop}>
          <View style={styles.previewTag}>
            <View style={styles.previewDot} />
            <Text variant="label" color="green">
              Preview — only you can see this
            </Text>
          </View>
        </View>

        <View style={styles.previewStage}>
          <Feather name="video-off" size={rf(34)} color={colors.textMuted} />
          <Text variant="bodyLg" color="textPrimary" align="center" style={styles.previewHeadline}>
            This is what viewers will see
          </Text>
          <Text variant="bodySm" color="textSecondary" align="center" style={styles.previewHint}>
            The moment you hit Go Live, everyone on Mitro can find and join this exact view — check
            your framing and lighting now.
          </Text>
        </View>

        <Text variant="bodySm" color="textMuted" style={styles.notVisible}>
          Camera and mic are on. You&apos;re not visible to anyone yet.
        </Text>

        <View style={styles.deviceRow}>
          <Pressable
            style={[styles.devicePill, cameraOn ? styles.devicePillOn : null]}
            onPress={() => setCameraOn((v) => !v)}
            accessibilityLabel={cameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            <Feather name={cameraOn ? 'video' : 'video-off'} size={rf(14)} color={cameraOn ? colors.green : colors.textMuted} />
            <Text variant="bodySm" color={cameraOn ? 'green' : 'textMuted'} style={styles.deviceLabel}>
              {cameraOn ? 'Camera on' : 'Camera off'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.devicePill, micOn ? styles.devicePillOn : null]}
            onPress={() => setMicOn((v) => !v)}
            accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            <Feather name={micOn ? 'mic' : 'mic-off'} size={rf(14)} color={micOn ? colors.green : colors.textMuted} />
            <Text variant="bodySm" color={micOn ? 'green' : 'textMuted'} style={styles.deviceLabel}>
              {micOn ? 'Mic on' : 'Mic off'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.checks}>
          <Text variant="bodySm" color="textMuted">
            Checking your setup —
          </Text>
          {CHECKS.map((c) => (
            <View key={c} style={styles.check}>
              <Feather name="check" size={rf(12)} color={colors.green} />
              <Text variant="bodySm" color="green" style={styles.checkLabel}>
                {c}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stream title */}
      <SectionLabel style={styles.sectionLabel}>STREAM TITLE</SectionLabel>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Friday Night Freestyle"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        maxLength={80}
        accessibilityLabel="Stream title"
      />

      {/* Category */}
      <SectionLabel divider style={styles.sectionLabel}>
        CATEGORY
      </SectionLabel>
      <View style={styles.catWrap}>
        {CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.catPill, active ? styles.catPillActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text variant="bodyLg" color={active ? 'pink' : 'textSecondary'} style={styles.catLabel}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Description */}
      <SectionLabel divider style={styles.sectionLabel}>
        DESCRIPTION (OPTIONAL)
      </SectionLabel>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="A line or two about what you're doing tonight…"
        placeholderTextColor={colors.textMuted}
        style={styles.textarea}
        multiline
        textAlignVertical="top"
        maxLength={300}
        accessibilityLabel="Stream description"
      />

      {/* Highlighted message price */}
      <SectionLabel divider style={styles.sectionLabel}>
        HIGHLIGHTED MESSAGE PRICE
      </SectionLabel>
      <TextInput
        value={highlightedPrice}
        onChangeText={(t) => setHighlightedPrice(t.replace(/[^0-9]/g, ''))}
        placeholder="e.g. 100"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        keyboardType="number-pad"
        maxLength={6}
        accessibilityLabel="Highlighted message price"
      />
      <Text variant="bodySm" color="textMuted" style={styles.fieldHint}>
        How many tokens a viewer pays to pin a message during this stream.
      </Text>

      {/* Reward menu */}
      <SectionLabel divider style={styles.sectionLabel}>
        REWARD MENU
      </SectionLabel>
      <Text variant="bodySm" color="textSecondary" style={styles.rewardIntro}>
        Fans redeem active rewards with coins while you&apos;re live. Manage which rewards are on
        from Settings.
      </Text>
      <View style={styles.rewardBox}>
        <View style={styles.rewardBoxLeft}>
          <Feather name="gift" size={rf(15)} color={colors.gold} />
          <Text variant="bodyLg" color="textPrimary" style={styles.rewardBoxText}>
            {activeRewards == null
              ? 'Loading rewards…'
              : `${activeRewards} reward${activeRewards === 1 ? '' : 's'} ${
                  activeRewards === 1 ? 'is' : 'are'
                } integrated in this session.`}
          </Text>
        </View>
        <Pressable
          style={styles.manageBtn}
          onPress={() => router.push('/(app)/(tabs)/me/settings')}
          accessibilityRole="button"
          accessibilityLabel="Manage rewards"
        >
          <Text variant="bodySm" color="textPrimary" style={styles.manageBtnText}>
            Manage Rewards
          </Text>
        </Pressable>
      </View>

      {/* Go live */}
      <Pressable
        style={[styles.cta, !canGoLive && styles.ctaDisabled]}
        onPress={goLive}
        disabled={!canGoLive}
        accessibilityRole="button"
        accessibilityLabel="Go live"
      >
        <LinearGradient
          colors={gradients.cta}
          start={gradientDirection.horizontal.start}
          end={gradientDirection.horizontal.end}
          style={styles.ctaFill}
        >
          <Feather name="radio" size={rf(17)} color={colors.white} />
          <Text style={styles.ctaLabel}>{resumable ? 'Resume live broadcast' : 'Go Live'}</Text>
        </LinearGradient>
      </Pressable>
      {resumable ? (
        <Text variant="bodySm" color="green" align="center" style={styles.ctaNote}>
          You have a live broadcast running — tap to jump back in.
        </Text>
      ) : !canGoLive ? (
        <Text variant="bodySm" color="textMuted" align="center" style={styles.ctaNote}>
          {title.trim().length === 0
            ? 'Add a stream title to go live.'
            : 'Set a highlighted message price to go live.'}
        </Text>
      ) : null}

      <Text variant="bodySm" color="textMuted" align="center" style={styles.legal}>
        By going live, you agree to our Community Guidelines.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  title: { marginTop: 6 },

  preview: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
    marginTop: 16,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center' },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successChip,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  previewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  previewStage: {
    backgroundColor: colors.cardRaised,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 34,
    paddingHorizontal: 20,
  },
  previewHeadline: { fontFamily: fontFamily.bold },
  previewHint: { lineHeight: rf(17) },
  notVisible: { textAlign: 'center' },
  deviceRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  devicePillOn: { backgroundColor: colors.successChip, borderColor: colors.successBorder },
  deviceLabel: { fontFamily: fontFamily.bold },
  checks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkLabel: { fontFamily: fontFamily.bold },

  sectionLabel: { marginTop: 12, marginBottom: 12 },
  input: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: rf(15),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldHint: { marginTop: 8 },

  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  catPillActive: { backgroundColor: colors.pinkSoft, borderColor: colors.borderHot },
  catLabel: { fontFamily: fontFamily.bold },

  textarea: {
    color: colors.textSecondary,
    fontFamily: fontFamily.body,
    fontSize: rf(13),
    lineHeight: rf(19),
    minHeight: 72,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  rewardIntro: { marginTop: -4, marginBottom: 12, lineHeight: rf(18) },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
  },
  rewardBoxLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardBoxText: { flex: 1, fontFamily: fontFamily.semibold },
  manageBtn: {
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  manageBtnText: { fontFamily: fontFamily.bold },

  cta: {
    height: 58,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 26,
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaLabel: { fontFamily: fontFamily.extrabold, fontSize: rf(14), letterSpacing: 0.5, color: colors.white },
  ctaNote: { marginTop: 10 },
  legal: { marginTop: 16 },
});

export default GoLiveScreen;
