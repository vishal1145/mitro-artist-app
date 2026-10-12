import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { EarningsBar, PageHeader, Screen } from '@components/shared';
import { GradientButton, LucideIcon, Text } from '@components/ui';
import { settingsApi } from '@services/api/settingsApi';
import { showToast } from '@utils/toast';
import {
  destroyAgoraEngine,
  isAgoraAvailable,
  requestCallPermissions,
  setLocalAudioEnabled,
  setLocalVideoEnabled,
  startLocalPreview,
  switchCamera,
} from '@services/agora/agoraEngine';
import { activeBroadcastStore } from '@services/broadcast/activeBroadcast';
import { useNotificationStore } from '@store';
import { colors, fontFamily, gradientDirection, gradients, layout, radius, size, spacing, typography } from '@theme';
import { rf } from '@utils/responsive';

// Matches the artist web's Go Live category chips (text-only pills).
const CATEGORIES = ['Music', 'Talk', 'Dance', 'Gaming', 'Art', 'Fitness'];

/** Live tab — the pre-flight "Let's get your stream ready" setup, matched to
 * the artist web's Go Live screen (real camera preview + working toggles). */
const GoLiveScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);
  const videoAvailable = isAgoraAvailable();

  // Empty by default — the artist fills these in, exactly like the web.
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Music');
  const [description, setDescription] = useState('');
  const [highlightedPrice, setHighlightedPrice] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [activeRewards, setActiveRewards] = useState<number | null>(null);

  const goingToRoomRef = useRef(false);

  // Re-fetch on every focus (not just mount) so a reward added in Settings and
  // then navigated back to reflects the new count immediately.
  useFocusEffect(
    useCallback(() => {
      settingsApi.getRewardMenu().then((res) => {
        if (res.success) setActiveRewards(res.data.filter((r) => r.isActive).length);
      });
    }, []),
  );

  // Start a real local camera/mic preview whenever this tab is focused, so the
  // artist sees their own feed and the on/off toggles actually control the
  // hardware — exactly like the web Go Live screen. Released on blur unless
  // we're handing the warm engine off to the live room.
  useFocusEffect(
    useCallback(() => {
      goingToRoomRef.current = false;
      let cancelled = false;
      (async () => {
        // Already broadcasting → jump straight back into the live room instead
        // of showing a "resume" button (no extra layer).
        const active = await activeBroadcastStore.get();
        if (cancelled) return;
        if (active) {
          goingToRoomRef.current = true;
          router.replace('/(app)/(modals)/live-broadcast-room');
          return;
        }
        const permitted = await requestCallPermissions();
        if (cancelled || !videoAvailable) return;
        if (!permitted) {
          showToast(
            'Camera and microphone access is needed to go live. Enable it in Settings.',
            'error',
          );
          return;
        }
        startLocalPreview();
        setLocalVideoEnabled(cameraOn);
        setLocalAudioEnabled(micOn);
        setReady(true);
        // Remount the surface a beat after the pipeline is up so it binds.
        setVideoKey((k) => k + 1);
        setTimeout(() => !cancelled && setVideoKey((k) => k + 1), 700);
      })();
      return () => {
        cancelled = true;
        if (!goingToRoomRef.current) {
          destroyAgoraEngine();
          setReady(false);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoAvailable]),
  );

  const toggleCamera = () => {
    setCameraOn((v) => {
      const next = !v;
      setLocalVideoEnabled(next);
      if (next) setVideoKey((k) => k + 1);
      return next;
    });
  };
  const toggleMic = () => {
    setMicOn((v) => {
      const next = !v;
      setLocalAudioEnabled(next);
      return next;
    });
  };

  const priceValid = highlightedPrice.trim().length > 0 && Number(highlightedPrice) > 0;
  const canGoLive = title.trim().length > 0 && priceValid;

  const goLive = () => {
    if (!canGoLive) return;
    goingToRoomRef.current = true; // keep the warm camera engine for the room

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

  const caption = cameraOn || micOn
    ? `Camera and mic are ${cameraOn && micOn ? 'on' : cameraOn ? 'on (mic off)' : 'on (camera off)'}. You're not visible to anyone yet.`
    : 'Camera and mic are off. Turn them on below when you’re ready to preview.';

  // Mirrors the web's `devicesReady`: a device that's ON is "ready" only once its
  // track has had a beat to acquire; a device that's OFF never blocks. So a fresh
  // ON device shows "Checking your setup…" briefly, then "You're all set".
  const [camReady, setCamReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  useEffect(() => {
    if (!videoAvailable || !cameraOn) {
      setCamReady(false);
      return;
    }
    setCamReady(false);
    const t = setTimeout(() => setCamReady(true), 1400);
    return () => clearTimeout(t);
  }, [cameraOn, videoAvailable]);
  useEffect(() => {
    if (!videoAvailable || !micOn) {
      setMicReady(false);
      return;
    }
    setMicReady(false);
    const t = setTimeout(() => setMicReady(true), 1400);
    return () => clearTimeout(t);
  }, [micOn, videoAvailable]);
  const devicesReady = (!cameraOn || camReady) && (!micOn || micReady);

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
      {/* Go Live studio (no outer card) */}
      <View style={styles.shell}>

        <PageHeader
          eyebrow="BEFORE YOU GO LIVE"
          eyebrowIcon="map-pin"
          title="Let's get your stream ready"
          onBack={() => router.navigate('/(app)/(tabs)/home')}
        />

        {/* .gl3-preview */}
        <View style={styles.preview}>
          <View style={StyleSheet.absoluteFill}>
            {videoAvailable && cameraOn && ready ? (
              <AgoraVideoView key={`golive-${videoKey}`} uid={0} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.empty}>
                <LinearGradient colors={gradients.emptyGlow} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                <View style={styles.emptyIcon}>
                  <LucideIcon name="video-off" size={rf(28)} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>This is what viewers will see</Text>
                <Text style={styles.emptyHint}>
                  The moment you hit Go Live, everyone on Mitro can find and join this exact view — check your framing and lighting now.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Preview — only you can see this</Text>
          </View>
          <View style={styles.nameTag}>
            <Text style={styles.nameText}>You</Text>
          </View>
          <View style={styles.level}>
            <LucideIcon name="mic-vocal" size={rf(14)} color={micOn ? colors.success : colors.error} />
          </View>
          <Text style={styles.captionBar}>{caption}</Text>
        </View>

        {/* .gl3-panel */}
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>What&apos;s tonight&apos;s stream about?</Text>
            <Text style={styles.panelIntro}>Viewers see this before they join — a clear title gets more people in the door.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>STREAM TITLE</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Friday Night Freestyle" placeholderTextColor={colors.textDim} style={styles.input} maxLength={80} accessibilityLabel="Stream title" />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.pills}>
              {CATEGORIES.map((cat) => {
                const active = cat === category;
                return (
                  <Pressable key={cat} onPress={() => setCategory(cat)} style={styles.pill} accessibilityRole="button" accessibilityState={{ selected: active }}>
                    {active ? <LinearGradient colors={gradients.cta} start={gradientDirection.diagonal.start} end={gradientDirection.diagonal.end} style={StyleSheet.absoluteFill} /> : null}
                    <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="A line or two about what you're doing tonight..." placeholderTextColor={colors.textDim} style={styles.input} maxLength={300} accessibilityLabel="Stream description" />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>HIGHLIGHTED MESSAGE PRICE</Text>
            <TextInput value={highlightedPrice} onChangeText={(t) => setHighlightedPrice(t.replace(/[^0-9]/g, ''))} placeholder="e.g. 100" placeholderTextColor={colors.textDim} style={styles.input} keyboardType="number-pad" maxLength={6} accessibilityLabel="Highlighted message price" />
            <Text style={styles.hint}>How many coins a viewer pays to pin a message during this stream.</Text>
          </View>

          <View style={styles.rewards}>
            <View style={styles.rewardsHead}>
              <LucideIcon name="gift" size={rf(16)} color={colors.pink} />
              <Text style={styles.rewardsTitle}>Reward Menu</Text>
            </View>
            <View style={styles.rewardSummary}>
              <Text style={styles.rewardText}>
                {activeRewards == null
                  ? 'Checking your reward menu…'
                  : activeRewards === 0
                    ? 'No rewards are turned on for this session.'
                    : `${activeRewards} reward${activeRewards === 1 ? '' : 's'} ${activeRewards === 1 ? 'is' : 'are'} integrated in this session.`}
              </Text>
              <Pressable style={styles.manageBtn} onPress={() => router.push('/(app)/(tabs)/me/settings')} accessibilityRole="button" accessibilityLabel="Manage rewards">
                <Text style={styles.manageText}>Manage Rewards</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* .gl3-bar */}
        <View style={styles.bar}>
          <View style={styles.checks}>
            {['camera', 'mic', 'connection'].map((c) => (
              <View key={c} style={styles.check}>
                <LucideIcon name="check" size={rf(12)} color={devicesReady ? colors.success : colors.textDim} />
                <Text style={[styles.checkText, devicesReady ? styles.checkOk : null]}>{c}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <GradientButton label="Go Live" leftIcon="radio" fullWidth={false} disabled={!canGoLive} onPress={goLive} />
            <View style={styles.ctl}>
              <Pressable onPress={toggleMic} accessibilityRole="button" accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'} style={[styles.round, micOn ? null : styles.roundMuted]}>
                <LucideIcon name="mic-vocal" size={rf(18)} color={micOn ? colors.textPrimary : colors.error} />
              </Pressable>
              <Text style={styles.ctlLabel}>Mic {micOn ? 'on' : 'off'}</Text>
            </View>
            <View style={styles.ctl}>
              <Pressable onPress={toggleCamera} accessibilityRole="button" accessibilityLabel={cameraOn ? 'Turn camera off' : 'Turn camera on'} style={[styles.round, cameraOn ? null : styles.roundMuted]}>
                <LucideIcon name="camera" size={rf(18)} color={cameraOn ? colors.textPrimary : colors.error} />
              </Pressable>
              <Text style={styles.ctlLabel}>Camera {cameraOn ? 'on' : 'off'}</Text>
            </View>
            {videoAvailable ? (
              <View style={styles.ctl}>
                <Pressable onPress={switchCamera} disabled={!cameraOn} accessibilityRole="button" accessibilityLabel="Flip camera" style={[styles.round, !cameraOn ? styles.roundDisabled : null]}>
                  <LucideIcon name="refresh-cw" size={rf(18)} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.ctlLabel}>Flip</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.note}>
            {!canGoLive
              ? title.trim().length === 0
                ? 'Add a stream title to go live.'
                : 'Set a highlighted message price to go live.'
              : "You'll be visible the moment your session connects — end the show any time."}
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.md },

  shell: { gap: spacing.md },

  preview: {
    minHeight: 336,
    borderWidth: 2,
    borderColor: colors.borderHot,
    borderRadius: radius.card,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.lg },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { ...typography.metric, textAlign: 'center', color: colors.textPrimary },
  emptyHint: { ...typography.subtitle, textAlign: 'center', color: colors.textMuted },
  badge: { position: 'absolute', top: spacing.sm, left: spacing.sm, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  badgeDot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.success },
  badgeText: { ...typography.bodySm, fontFamily: fontFamily.medium, color: colors.textPrimary },
  nameTag: { position: 'absolute', left: spacing.sm, bottom: 48, zIndex: 2, paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, backgroundColor: colors.pink, borderRadius: radius.xs },
  nameText: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.onPrimarySolid },
  level: { position: 'absolute', right: spacing.sm, bottom: 48, zIndex: 2, width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  captionBar: { ...typography.bodySm, position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, color: colors.textMuted, backgroundColor: colors.glass, borderTopWidth: 1, borderTopColor: colors.borderSoft },

  panel: { gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  panelHead: { gap: spacing.xxs },
  panelTitle: { ...typography.metric, color: colors.textPrimary },
  panelIntro: { ...typography.subtitle, color: colors.textMuted },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.label, color: colors.textMuted },
  input: { ...typography.input, height: size.input, paddingHorizontal: spacing.md, color: colors.textPrimary, backgroundColor: colors.backgroundDeep, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input },
  hint: { ...typography.subtitle, color: colors.textDim },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' },
  pillText: { ...typography.subtitle, fontFamily: fontFamily.medium, color: colors.textMuted },
  pillTextActive: { color: colors.white },
  rewards: { paddingTop: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  rewardsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rewardsTitle: { ...typography.body, fontFamily: fontFamily.semibold, color: colors.textPrimary },
  rewardSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  rewardText: { ...typography.subtitle, flex: 1, color: colors.textPrimary },
  manageBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.button },
  manageText: { ...typography.bodySm, fontFamily: fontFamily.semibold, color: colors.textPrimary },

  bar: { alignItems: 'center', gap: spacing.md },
  checks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.md, rowGap: spacing.xs },
  check: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  checkText: { ...typography.bodySm, color: colors.textDim },
  checkOk: { color: colors.success },
  actions: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: spacing.md },
  ctl: { alignItems: 'center', gap: spacing.xxs },
  round: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  roundMuted: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
  roundDisabled: { opacity: 0.4 },
  ctlLabel: { ...typography.bodySm, color: colors.textMuted },
  note: { ...typography.bodySm, textAlign: 'center', color: colors.textDim },
});

export default GoLiveScreen;
