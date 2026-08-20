import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { EarningsBar, Screen, SectionLabel } from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

const CATEGORIES: { key: string; icon: FeatherIconName }[] = [
  { key: 'Gaming', icon: 'monitor' },
  { key: 'Music', icon: 'music' },
  { key: 'Talk', icon: 'message-circle' },
];

const CHECKS = ['camera detected', 'mic detected', 'connection looks good'];

const PREVIEW_CONTROLS: { icon: FeatherIconName; label: string }[] = [
  { icon: 'refresh-cw', label: 'Flip camera' },
  { icon: 'mic', label: 'Audio settings' },
  { icon: 'sun', label: 'Lighting' },
];

interface Reward {
  id: string;
  title: string;
  sub: string;
  coins: number;
  on: boolean;
}

const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: 'Say My Name', sub: 'Give a live shoutout on stream', coins: 50, on: true },
  { id: 'r2', title: 'Read My Message', sub: "Read a fan's message out loud", coins: 100, on: false },
];

/** Live tab — the pre-flight check before opening the doors. */
const GoLiveScreen = () => {
  const router = useRouter();

  const [title, setTitle] = useState('Late night vibes & requests 🎶');
  const [category, setCategory] = useState('Music');
  const [description, setDescription] = useState(
    'Taking song requests, testing a new hook, and reading your messages between tracks.',
  );
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [rewards, setRewards] = useState(INITIAL_REWARDS);

  const toggleReward = (id: string) =>
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread
        />
      }
    >

      <Text variant="h1" style={styles.title}>
        Go Live
      </Text>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={styles.previewTop}>
          <View style={styles.previewTag}>
            <View style={styles.previewDot} />
            <Text variant="label" color="pink">
              PREVIEW
            </Text>
          </View>

          <View style={styles.qualityTag}>
            <Text variant="label" color="cyan">
              1080p
            </Text>
          </View>
        </View>

        <Text variant="bodySm" color="textSecondary" align="center" style={styles.previewHint}>
          Check your framing and lighting.
        </Text>

        <View style={styles.notVisible}>
          <Feather name="x-circle" size={rf(13)} color={colors.textMuted} />
          <Text variant="bodySm" color="textMuted">
            Not visible yet
          </Text>
        </View>

        <View style={styles.deviceRow}>
          <Pressable
            style={[styles.devicePill, cameraOn ? styles.devicePillOn : null]}
            onPress={() => setCameraOn((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ selected: cameraOn }}
            accessibilityLabel={cameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            <Feather
              name={cameraOn ? 'video' : 'video-off'}
              size={rf(14)}
              color={cameraOn ? colors.green : colors.textMuted}
            />
            <Text variant="bodySm" color={cameraOn ? 'green' : 'textMuted'} style={styles.deviceLabel}>
              {cameraOn ? 'Camera on' : 'Camera off'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.devicePill, micOn ? styles.devicePillOn : null]}
            onPress={() => setMicOn((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ selected: micOn }}
            accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            <Feather
              name={micOn ? 'mic' : 'mic-off'}
              size={rf(14)}
              color={micOn ? colors.green : colors.textMuted}
            />
            <Text variant="bodySm" color={micOn ? 'green' : 'textMuted'} style={styles.deviceLabel}>
              {micOn ? 'Mic on' : 'Mic off'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.checks}>
          {CHECKS.map((c) => (
            <View key={c} style={styles.check}>
              <Feather name="check" size={rf(12)} color={colors.green} />
              <Text variant="bodySm" color="green" style={styles.checkLabel}>
                {c}
              </Text>
            </View>
          ))}
        </View>

        {/* Capture controls, stacked down the right edge of the frame */}
        <View style={styles.floating}>
          {PREVIEW_CONTROLS.map((c) => (
            <Pressable
              key={c.label}
              style={styles.floatBtn}
              accessibilityRole="button"
              accessibilityLabel={c.label}
            >
              <Feather name={c.icon} size={rf(16)} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stream title */}
      <SectionLabel style={styles.sectionLabel}>STREAM TITLE</SectionLabel>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Enter an engaging title…"
        placeholderTextColor={colors.textMuted}
        style={styles.titleInput}
        maxLength={80}
        accessibilityLabel="Stream title"
      />

      {/* Category */}
      <SectionLabel divider style={styles.sectionLabel}>
        CATEGORY
      </SectionLabel>
      <View style={styles.catRow}>
        {CATEGORIES.map((cat) => {
          const active = cat.key === category;

          return (
            <Pressable
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              style={[styles.catPill, active ? styles.catPillActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.key}
            >
              <Feather
                name={cat.icon}
                size={rf(14)}
                color={active ? colors.pink : colors.textSecondary}
              />
              <Text
                variant="bodyLg"
                color={active ? 'pink' : 'textSecondary'}
                style={styles.catLabel}
              >
                {cat.key}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Description */}
      <SectionLabel divider style={styles.sectionLabel}>
        DESCRIPTION
      </SectionLabel>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Tell viewers what you're doing today…"
        placeholderTextColor={colors.textMuted}
        style={styles.textarea}
        multiline
        textAlignVertical="top"
        maxLength={300}
        accessibilityLabel="Stream description"
      />

      {/* Reward menu */}
      <SectionLabel divider style={styles.sectionLabel} onHelp={() => undefined}>
        REWARD MENU
      </SectionLabel>
      {rewards.map((r, i) => (
        <View key={r.id} style={[styles.reward, i === 0 ? null : styles.rewardDivider]}>
          <View style={styles.rewardText}>
            <Text variant="bodyLg" color="textPrimary" style={styles.rewardTitle}>
              {r.title}
            </Text>
            <Text variant="bodySm" color="textMuted">
              {r.sub}
            </Text>
          </View>

          <Text variant="bodyLg" color="gold" style={styles.rewardCoins}>
            {r.coins} coins
          </Text>

          <Switch
            value={r.on}
            onValueChange={() => toggleReward(r.id)}
            trackColor={{ false: colors.cardRaised, true: colors.green }}
            thumbColor={colors.white}
            accessibilityLabel={`${r.title} reward`}
          />
        </View>
      ))}

      {/* Go */}
      <Pressable
        style={styles.cta}
        // push, not replace — replacing across navigator groups (tab stack ->
        // modal group) does not reliably mount the modal. The room itself has
        // no back affordance and exits via replace, so setup is never revisited.
        onPress={() =>
          router.push({
            pathname: '/(app)/(modals)/live-broadcast-room',
            params: { sessionConfig: JSON.stringify({ title, category, description }) },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Start live broadcast"
      >
        <LinearGradient
          colors={gradients.cta}
          start={gradientDirection.horizontal.start}
          end={gradientDirection.horizontal.end}
          style={styles.ctaFill}
        >
          <Feather name="radio" size={rf(17)} color={colors.white} />
          <Text style={styles.ctaLabel}>START LIVE BROADCAST</Text>
        </LinearGradient>
      </Pressable>

      <Text variant="bodySm" color="textMuted" align="center" style={styles.legal}>
        By going live, you agree to our Community Guidelines.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  title: {
    marginTop: 12,
  },
  subtitle: {
    marginTop: 8,
  },

  preview: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
    marginTop: 12,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pink,
  },
  qualityTag: {
    borderWidth: 1,
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  previewHint: {
    // Keeps the copy clear of the control stack on the right.
    paddingHorizontal: 34,
    marginTop: 12,
    lineHeight: rf(17),
  },
  notVisible: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
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
  devicePillOn: {
    backgroundColor: colors.successChip,
    borderColor: colors.successBorder,
  },
  deviceLabel: {
    fontFamily: fontFamily.bold,
  },
  checks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkLabel: {
    fontFamily: fontFamily.bold,
  },
  floating: {
    position: 'absolute',
    right: 14,
    top: 58,
    gap: 10,
  },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 14,
  },

  titleInput: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: rf(15),
    padding: 0,
  },

  catRow: {
    flexDirection: 'row',
    gap: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  catPillActive: {
    backgroundColor: colors.pinkSoft,
    borderColor: colors.borderHot,
  },
  catLabel: {
    fontFamily: fontFamily.bold,
  },

  textarea: {
    color: colors.textSecondary,
    fontFamily: fontFamily.body,
    fontSize: rf(11),
    lineHeight: rf(18),
    minHeight: 70,
    padding: 0,
  },

  rewardNote: {
    marginTop: -4,
    marginBottom: 8,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rewardDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardText: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontFamily: fontFamily.bold,
  },
  rewardCoins: {
    fontFamily: fontFamily.extrabold,
  },

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
  ctaFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12),
    letterSpacing: 0.8,
    color: colors.white,
  },

  legal: {
    marginTop: 16,
  },
});

export default GoLiveScreen;
