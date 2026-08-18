import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Screen, ToggleRow } from '@components/shared';
import { Card, GradientButton, LogoBadge, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

const CATEGORIES: { key: string; icon: IoniconName }[] = [
  { key: 'Gaming', icon: 'game-controller-outline' },
  { key: 'Music', icon: 'musical-note' },
  { key: 'Talk', icon: 'chatbubble-outline' },
];

const CHECKS = ['camera detected', 'mic detected', 'connection looks good'];

/** Live tab — Go Live setup screen. */
const GoLiveScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [description, setDescription] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sayMyName, setSayMyName] = useState(true);
  const [readMyMessage, setReadMyMessage] = useState(false);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* App bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <LogoBadge variant="wave" size={wp(8)} />
          <Text variant="h3" style={styles.appBarTitle}>
            Go Live
          </Text>
        </View>
        <View style={styles.appBarRight}>
          <Ionicons name="notifications-outline" size={rf(22)} color={colors.textSecondary} />
          <View style={styles.avatar}>
            <Ionicons name="person" size={rf(18)} color={colors.onPrimaryContrast} />
          </View>
        </View>
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={styles.previewTop}>
          <View style={styles.previewTag}>
            <View style={styles.liveDot} />
            <Text variant="label" color="textSecondary">
              PREVIEW
            </Text>
          </View>
          <View style={styles.previewTag}>
            <Ionicons name="cellular" size={rf(13)} color={colors.textSecondary} />
            <Text variant="caption" color="textSecondary">
              1080p
            </Text>
          </View>
        </View>

        <Text variant="caption" color="textMuted" align="center" style={styles.previewHint}>
          The moment you hit Go Live, everyone on Mitro can find and join this exact view — check your framing and lighting now.
        </Text>

        <View style={styles.notVisible}>
          <Ionicons name="eye-off-outline" size={rf(13)} color={colors.textMuted} />
          <Text variant="caption" color="textMuted">
            You&apos;re not visible to anyone yet.
          </Text>
        </View>

        <View style={styles.toggleRow}>
          <Pressable style={styles.toggleBtn} onPress={() => setCameraOn((v) => !v)} accessibilityRole="button">
            <Ionicons name={cameraOn ? 'videocam-outline' : 'videocam-off-outline'} size={rf(15)} color={colors.textPrimary} />
            <Text variant="caption" color="textPrimary">
              {cameraOn ? 'Camera on' : 'Camera off'}
            </Text>
          </Pressable>
          <Pressable style={styles.toggleBtn} onPress={() => setMicOn((v) => !v)} accessibilityRole="button">
            <Ionicons name={micOn ? 'mic-outline' : 'mic-off-outline'} size={rf(15)} color={colors.textPrimary} />
            <Text variant="caption" color="textPrimary">
              {micOn ? 'Mic on' : 'Mic off'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.checks}>
          {CHECKS.map((c) => (
            <View key={c} style={styles.check}>
              <Ionicons name="checkmark-circle" size={rf(12)} color={colors.success} />
              <Text variant="caption" color="textMuted" style={styles.checkLabel}>
                {c}
              </Text>
            </View>
          ))}
        </View>

        {/* Floating controls */}
        <View style={styles.floating}>
          {(['camera-reverse', 'mic', 'sparkles'] as IoniconName[]).map((icon) => (
            <Pressable key={icon} style={styles.floatBtn} accessibilityRole="button" accessibilityLabel={icon}>
              <Ionicons name={icon} size={rf(18)} color={colors.textPrimary} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stream setup */}
      <Card style={styles.section}>
        <Text variant="label" color="textMuted">
          STREAM TITLE
        </Text>
        <View style={styles.inputRow}>
          <Ionicons name="create-outline" size={rf(16)} color={colors.textMuted} />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter an engaging title…"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            maxLength={80}
          />
        </View>

        <Text variant="label" color="textMuted">
          CATEGORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((cat) => {
            const active = cat.key === category;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[styles.catPill, active ? styles.catPillActive : styles.catPillIdle]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={cat.icon} size={rf(15)} color={active ? colors.ctaDark : colors.textSecondary} />
                <Text variant="body" color={active ? 'ctaDark' : 'textSecondary'}>
                  {cat.key}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text variant="label" color="textMuted">
          DESCRIPTION
        </Text>
        <View style={styles.textareaWrap}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell viewers what you're doing today…"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.textarea}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
          />
        </View>
      </Card>

      {/* Reward menu */}
      <Card style={styles.section}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardIcon}>
            <Ionicons name="star" size={rf(16)} color={colors.warning} />
          </View>
          <View>
            <Text variant="h3">Reward Menu</Text>
            <Text variant="caption" color="warning">
              Boost viewer engagement
            </Text>
          </View>
        </View>

        <RewardRow icon="megaphone-outline" name="Say My Name" coins="50" value={sayMyName} onValueChange={setSayMyName} />
        <RewardRow icon="chatbox-ellipses-outline" name="Read My Message" coins="100" value={readMyMessage} onValueChange={setReadMyMessage} />
      </Card>

      <GradientButton
        label="START LIVE BROADCAST"
        gradient="primary"
        textColor="ctaDark"
        leftIcon="radio"
        // push, not replace — replacing across navigator groups (tab stack ->
        // modal group) does not reliably mount the modal. The room itself has
        // no back affordance and exits via replace, so setup is never revisited.
        onPress={() =>
          router.push({
            pathname: '/(app)/(modals)/live-broadcast-room',
            params: { sessionConfig: JSON.stringify({ title, category, description }) },
          })
        }
      />

      <Text variant="caption" color="textMuted" align="center">
        By going live, you agree to our Community Guidelines.
      </Text>
    </Screen>
  );
};

const RewardRow = ({
  icon,
  name,
  coins,
  value,
  onValueChange,
}: {
  icon: IoniconName;
  name: string;
  coins: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <ToggleRow
    icon={icon}
    label={name}
    description={`◎ ${coins} coins`}
    value={value}
    onValueChange={onValueChange}
    style={styles.rewardRow}
  />
);

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appBarTitle: {
    fontSize: rf(17),
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Preview
  preview: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: radius.full,
    backgroundColor: colors.error,
  },
  previewHint: {
    maxWidth: '80%',
    alignSelf: 'center',
  },
  notVisible: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    backgroundColor: colors.chipSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  checks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  checkLabel: {
    fontSize: rf(10),
  },
  floating: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  floatBtn: {
    width: wp(11),
    height: wp(11),
    borderRadius: radius.full,
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(15),
    paddingVertical: spacing.sm,
  },
  catRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
    marginBottom: spacing.xs,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  catPillActive: {
    backgroundColor: colors.primary,
  },
  catPillIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textareaWrap: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textarea: {
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(15),
    minHeight: wp(20),
  },

  // Reward menu
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rewardIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.warningChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardRow: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});

export default GoLiveScreen;
