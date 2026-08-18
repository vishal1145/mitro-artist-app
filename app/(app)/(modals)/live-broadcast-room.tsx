import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet, ListRow, ToggleRow } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, gradients, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

const SUPPORTERS = [
  { id: 'sp1', initials: 'NR', name: 'NeonRider', amount: '150 tk' },
  { id: 'sp2', initials: 'PQ', name: 'PixelQueen', amount: '95 tk' },
  { id: 'sp3', initials: 'JC', name: 'JazzCat', amount: '60 tk' },
];

type ChatItem =
  | { id: string; kind: 'msg'; user: string; body: string }
  | { id: string; kind: 'reward'; user: string; note: string; amount: string };

const CHAT: ChatItem[] = [
  { id: 'c1', kind: 'msg', user: 'CyberPunk99', body: "Let's goooo! The stream looks so crisp today." },
  { id: 'c2', kind: 'msg', user: 'LofiBeats', body: 'What gear are you using rn?' },
  { id: 'c3', kind: 'reward', user: 'NeonRider', note: 'Keep up the great work!', amount: '+25 tk' },
  { id: 'c4', kind: 'msg', user: 'GamerX', body: 'W stream W vibes' },
  { id: 'c5', kind: 'msg', user: 'SleepyPanda', body: 'I love this overlay tbh' },
];

const REWARDS: { id: string; icon: IoniconName; label: string; price: string }[] = [
  { id: 'r1', icon: 'megaphone-outline', label: 'Say My Name', price: '20 tk' },
  { id: 'r2', icon: 'chatbox-ellipses-outline', label: 'Read My Message', price: '25 tk' },
  { id: 'r3', icon: 'mic-outline', label: 'Shoutout on Stream', price: '50 tk' },
];

/** mm:ss / hh:mm:ss elapsed formatter. */
const formatElapsed = (total: number): string => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const LiveBroadcastRoomScreen = () => {
  const router = useRouter();
  const { sessionConfig } = useLocalSearchParams<{ sessionConfig?: string }>();

  const [elapsed, setElapsed] = useState(42 * 60 + 15);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [beautyOn, setBeautyOn] = useState(false);
  const [chatOn, setChatOn] = useState(true);
  const chatRef = useRef<ScrollView>(null);

  const title = (() => {
    try {
      return sessionConfig ? (JSON.parse(sessionConfig).title as string) : '';
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /** Ending is destructive — confirm, then replace so back can't return here. */
  const confirmEnd = () => {
    Alert.alert(
      'End broadcast?',
      'Your stream will end for everyone watching. You can review the summary afterwards.',
      [
        { text: 'Keep streaming', style: 'cancel' },
        {
          text: 'End broadcast',
          style: 'destructive',
          onPress: () =>
            router.replace({
              pathname: '/(app)/(modals)/broadcast-summary',
              params: { broadcastId: 'bc_live' },
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Video surface placeholder */}
      <View style={styles.stage}>
        <Ionicons name="videocam" size={rf(40)} color={colors.textDisabled} />
        <Text variant="caption" color="textMuted">
          {camOn ? 'Camera preview' : 'Camera off'}
        </Text>
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text variant="label" color="successBg">
              LIVE
            </Text>
          </View>
          <Text variant="label" color="textPrimary">
            {formatElapsed(elapsed)}
          </Text>
        </View>

        <View style={styles.topRight}>
          <View style={styles.viewerPill}>
            <Ionicons name="eye" size={rf(14)} color={colors.textPrimary} />
            <Text variant="label" color="textPrimary">
              1.2K
            </Text>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Broadcast settings"
          >
            <Ionicons name="settings-outline" size={rf(18)} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Right rail */}
      <View style={styles.rail}>
        {(['camera-reverse', 'sparkles', 'share-outline'] as IoniconName[]).map((icon) => (
          <Pressable
            key={icon}
            style={styles.railBtn}
            accessibilityRole="button"
            accessibilityLabel={icon}
          >
            <Ionicons name={icon} size={rf(20)} color={colors.textPrimary} />
          </Pressable>
        ))}
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottom} pointerEvents="box-none">
        <LinearGradient colors={gradients.scrim} style={styles.bottomScrim} pointerEvents="none" />

        <View style={styles.bottomContent}>
          {/* Earnings */}
          <View style={styles.earnings}>
            <Ionicons name="cash-outline" size={rf(15)} color={colors.success} />
            <Text variant="label" color="success">
              674 tk this stream
            </Text>
          </View>

          {/* Top supporters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.supportersScroll}
            contentContainerStyle={styles.supporters}
          >
            {SUPPORTERS.map((s) => (
              <View key={s.id} style={styles.supporter}>
                <Avatar initials={s.initials} name={s.name} size="sm" />
                <View>
                  <Text variant="caption" color="textSecondary" style={styles.tiny}>
                    {s.name}
                  </Text>
                  <Text variant="label" color="warning">
                    {s.amount}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Chat feed */}
          {chatOn ? (
            <ScrollView
              ref={chatRef}
              style={styles.chat}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
            >
              {CHAT.map((c) =>
                c.kind === 'reward' ? (
                  <View key={c.id} style={styles.rewardEvent}>
                    <View style={styles.rewardIcon}>
                      <Ionicons name="gift" size={rf(15)} color={colors.warning} />
                    </View>
                    <View style={styles.rewardBody}>
                      <Text variant="caption" color="textPrimary">
                        <Text variant="caption" color="warning">
                          {c.user}
                        </Text>{' '}
                        sent a Super Chat!
                      </Text>
                      <Text variant="caption" color="textSecondary" style={styles.italic}>
                        &quot;{c.note}&quot;
                      </Text>
                    </View>
                    <Text variant="label" color="warning">
                      {c.amount}
                    </Text>
                  </View>
                ) : (
                  <View key={c.id} style={styles.chatRow}>
                    <Avatar initials={c.user.slice(0, 2).toUpperCase()} size="sm" />
                    <View style={styles.chatText}>
                      <Text variant="caption" color="primary">
                        {c.user}
                      </Text>
                      <Text variant="caption" color="textPrimary">
                        {c.body}
                      </Text>
                    </View>
                  </View>
                ),
              )}
            </ScrollView>
          ) : null}

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              style={styles.ctrlBtn}
              onPress={() => setMicOn((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              <Ionicons name={micOn ? 'mic' : 'mic-off'} size={rf(20)} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              style={styles.ctrlBtn}
              onPress={() => setCamOn((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={camOn ? 'Turn camera off' : 'Turn camera on'}
            >
              <Ionicons
                name={camOn ? 'videocam' : 'videocam-off'}
                size={rf(20)}
                color={colors.textPrimary}
              />
            </Pressable>

            <Pressable
              style={styles.endBtn}
              onPress={confirmEnd}
              accessibilityRole="button"
              accessibilityLabel="End broadcast"
            >
              <Ionicons name="close" size={rf(26)} color={colors.errorBg} />
            </Pressable>

            <Pressable
              style={styles.ctrlBtn}
              onPress={() => setChatOn((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={chatOn ? 'Hide chat' : 'Show chat'}
            >
              <Ionicons name="chatbubble" size={rf(20)} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              style={styles.ctrlBtn}
              onPress={() => setRewardsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Reward menu"
            >
              <Ionicons name="gift" size={rf(20)} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Reward sheet */}
      <BottomSheet
        visible={rewardsOpen}
        onClose={() => setRewardsOpen(false)}
        title="Reward Menu"
        snapPoints={[0.45]}
      >
        {REWARDS.map((r, i) => (
          <ListRow
            key={r.id}
            icon={r.icon}
            iconTint={colors.warning}
            title={r.label}
            subtitle={`${r.price} · live now`}
            divider={i > 0}
            chevron={false}
          />
        ))}
      </BottomSheet>

      {/* Settings sheet */}
      <BottomSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={title ? `Settings · ${title}` : 'Broadcast Settings'}
        snapPoints={[0.5]}
      >
        <View style={styles.sheetBody}>
          <ToggleRow
            icon="sparkles-outline"
            label="Beauty filter"
            description="Smooths the camera feed"
            value={beautyOn}
            onValueChange={setBeautyOn}
          />
          <ToggleRow
            icon="chatbubble-outline"
            label="Show live chat"
            description="Hide to focus on the camera"
            value={chatOn}
            onValueChange={setChatOn}
          />
          <ToggleRow
            icon="mic-outline"
            label="Microphone"
            value={micOn}
            onValueChange={setMicOn}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.glassSurface,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  liveDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.chipSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  iconBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: radius.full,
    backgroundColor: colors.chipSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rail: {
    position: 'absolute',
    right: spacing.md,
    top: wp(28),
    gap: spacing.md,
  },
  railBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.full,
    backgroundColor: colors.glassSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  earnings: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  supportersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  supporters: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  supporter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.chipSurface,
    borderRadius: radius.pill,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  tiny: {
    fontSize: rf(10),
  },

  chat: {
    maxHeight: wp(42),
  },
  chatContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatText: {
    flex: 1,
  },
  rewardEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.sm,
  },
  rewardIcon: {
    width: wp(8),
    height: wp(8),
    borderRadius: radius.full,
    backgroundColor: colors.warningChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBody: {
    flex: 1,
  },
  italic: {
    fontStyle: 'italic',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glassSurface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  ctrlBtn: {
    width: wp(13),
    height: wp(13),
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    width: wp(15),
    height: wp(15),
    borderRadius: radius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetBody: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
});

export default LiveBroadcastRoomScreen;
