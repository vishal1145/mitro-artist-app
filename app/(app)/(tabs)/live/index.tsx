import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AgoraVideoView } from '@components/call/AgoraVideoView';
import { EarningsBar, Screen } from '@components/shared';
import { Text } from '@components/ui';
import { settingsApi } from '@services/api/settingsApi';
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
import { colors, layout, radius, typography } from '@theme';
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
        await requestCallPermissions();
        if (cancelled || !videoAvailable) return;
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
      {/* Header: eyebrow + title (left), stepper (right) */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.eyebrowRow}>
            <Feather name="map-pin" size={rf(12)} color={colors.pink} />
            <Text variant="label" color="pink">BEFORE YOU GO LIVE</Text>
          </View>
          <Text variant="h1" style={styles.title}>Let&apos;s get your stream ready</Text>
        </View>
        <View style={styles.stepper}>
          <View style={styles.stepperTrack}>
            <View style={[styles.stepDot, styles.stepDotFilled]} />
            <View style={styles.stepDot} />
          </View>
          <Text variant="bodySm" color="textMuted" style={styles.stepperText}>Step 1 of 2 — Set up</Text>
        </View>
      </View>

      {/* Preview stage (box: badge · content · caption footer) */}
      <View style={styles.stage}>
        <LinearGradient
          colors={['rgba(255,63,173,0.16)', 'rgba(140,77,255,0.10)', 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.previewBadge}>
          <View style={styles.previewBadgeDot} />
          <Text style={styles.previewBadgeText}>Preview — only you can see this</Text>
        </View>

        <View style={styles.stageContent}>
          {videoAvailable && cameraOn && ready ? (
            <AgoraVideoView key={`golive-${videoKey}`} uid={0} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.stagePlaceholder}>
              <Feather name="video-off" size={rf(52)} color="rgba(255,255,255,0.4)" />
              <Text style={styles.stageHeadline}>This is what viewers will see</Text>
              <Text variant="bodySm" align="center" style={styles.stageHint}>
                The moment you hit Go Live, everyone on Mitro can find and join this exact view — check
                your framing and lighting now.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.previewCaption}>{caption}</Text>
      </View>

      {/* Camera / Mic / Flip controls */}
      <View style={styles.controls}>
        <Pressable
          style={[styles.controlBtn, cameraOn ? null : styles.controlBtnMuted]}
          onPress={toggleCamera}
          accessibilityLabel={cameraOn ? 'Turn camera off' : 'Turn camera on'}
        >
          <Feather name={cameraOn ? 'video' : 'video-off'} size={rf(15)} color={cameraOn ? colors.textPrimary : '#FF8A97'} />
          <Text style={[styles.controlText, cameraOn ? null : styles.controlTextMuted]}>Camera {cameraOn ? 'on' : 'off'}</Text>
        </Pressable>
        <Pressable
          style={[styles.controlBtn, micOn ? null : styles.controlBtnMuted]}
          onPress={toggleMic}
          accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          <Feather name={micOn ? 'mic' : 'mic-off'} size={rf(15)} color={micOn ? colors.textPrimary : '#FF8A97'} />
          <Text style={[styles.controlText, micOn ? null : styles.controlTextMuted]}>Mic {micOn ? 'on' : 'off'}</Text>
        </Pressable>
        {videoAvailable ? (
          <Pressable style={styles.controlBtn} onPress={switchCamera} disabled={!cameraOn} accessibilityLabel="Flip camera">
            <Feather name="refresh-cw" size={rf(15)} color={colors.textPrimary} />
            <Text style={styles.controlText}>Flip</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Setup checklist — grey until the camera/mic pipeline is ready */}
      <View style={styles.checks}>
        <Text style={styles.checksLead}>{devicesReady ? "You're all set —" : 'Checking your setup —'}</Text>
        {['camera detected', 'mic detected', 'connection looks good'].map((c) => (
          <View key={c} style={styles.check}>
            <Feather name="check" size={rf(12)} color={devicesReady ? colors.green : 'rgba(255,255,255,0.35)'} />
            <Text style={[styles.checkLabel, { color: devicesReady ? colors.green : 'rgba(255,255,255,0.35)' }]}>{c}</Text>
          </View>
        ))}
      </View>

      {/* Form card (web .golive-form) */}
      <View style={styles.formCard}>
        <View>
          <Text style={styles.formHeading}>What&apos;s tonight&apos;s stream about?</Text>
          <Text style={styles.formIntro}>Viewers see this before they join — a clear title gets more people in the door.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>STREAM TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Friday Night Freestyle"
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.input}
            maxLength={80}
            accessibilityLabel="Stream title"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <View style={styles.catWrap}>
            {CATEGORIES.map((cat) => {
              const active = cat === category;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catPill, active && styles.catPillActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  {active ? (
                    <LinearGradient colors={['#FF3FAD', '#8C4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Text style={[styles.catLabel, active && styles.catLabelActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="A line or two about what you're doing tonight…"
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.textarea}
            multiline
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel="Stream description"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>HIGHLIGHTED MESSAGE PRICE</Text>
          <TextInput
            value={highlightedPrice}
            onChangeText={(t) => setHighlightedPrice(t.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 100"
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel="Highlighted message price"
          />
          <Text style={styles.fieldHint}>How many coins a viewer pays to pin a message during this stream.</Text>
        </View>

        {/* Reward menu (web .golive-rewards) */}
        <View style={styles.rewards}>
          <View style={styles.rewardsHead}>
            <Feather name="gift" size={rf(16)} color="#FFFAFF" />
            <Text style={styles.rewardsTitle}>Reward Menu</Text>
          </View>
          <Text style={styles.rewardsIntro}>Fans redeem active rewards with coins while you&apos;re live. Manage which rewards are on from Settings.</Text>
          <View style={styles.rewardSummary}>
            <Text style={styles.rewardSummaryText}>
              {activeRewards == null
                ? 'Checking your reward menu…'
                : activeRewards === 0
                  ? 'No rewards are turned on for this session.'
                  : `${activeRewards} reward${activeRewards === 1 ? '' : 's'} ${activeRewards === 1 ? 'is' : 'are'} integrated in this session.`}
            </Text>
            <Pressable style={styles.manageBtn} onPress={() => router.push('/(app)/(tabs)/me/settings')} accessibilityRole="button" accessibilityLabel="Manage rewards">
              <Text style={styles.manageBtnText}>Manage Rewards</Text>
            </Pressable>
          </View>
        </View>

        {/* Go live (web .golive-submit) */}
        <Pressable style={[styles.cta, !canGoLive && styles.ctaDisabled]} onPress={goLive} disabled={!canGoLive} accessibilityRole="button" accessibilityLabel="Go live">
          <LinearGradient colors={['#FF3FAD', '#8C4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaFill}>
            <Feather name="radio" size={rf(17)} color={colors.white} />
            <Text style={styles.ctaLabel}>Go Live</Text>
          </LinearGradient>
        </Pressable>

        {!canGoLive ? (
          <Text style={styles.submitCaption}>{title.trim().length === 0 ? 'Add a stream title to go live.' : 'Set a highlighted message price to go live.'}</Text>
        ) : (
          <Text style={styles.submitCaption}>You&apos;ll be visible the moment the app confirms your session connects — you can end the show any time.</Text>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12 },
  headerLeft: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { marginTop: 6 },
  stepper: { alignItems: 'flex-end', gap: 6, paddingTop: 4 },
  stepperTrack: { flexDirection: 'row', gap: 5 },
  stepDot: { width: 22, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)' },
  stepDotFilled: { backgroundColor: colors.pink },
  stepperText: {
    ...typography.label,
  },

  // Preview stage — dark, radial-tinted, min 320
  stage: {
    minHeight: 340,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: '#0B0916',
    overflow: 'hidden',
    marginTop: 16,
  },
  stageContent: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  previewCaption: {
    ...typography.bodySm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,250,255,0.72)',
  },
  previewBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(5,4,11,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewBadgeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
  previewBadgeText: {
    ...typography.label,
  },
  stagePlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  stageHeadline: {
    ...typography.h3,
  },
  stageHint: { color: 'rgba(255,250,255,0.72)', lineHeight: rf(18), paddingHorizontal: 8 },

  // Controls
  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  controlBtnMuted: { borderColor: 'rgba(239,68,68,0.45)', backgroundColor: 'rgba(239,68,68,0.14)' },
  controlText: {
    ...typography.bodySm,
  },
  controlTextMuted: { color: '#FF8A97' },

  // Checklist
  checks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 6,
    columnGap: 12,
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  checksLead: {
    ...typography.bodySm,
  },
  check: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkLabel: {
    ...typography.bodySm,
  },

  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  formCard: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', borderRadius: radius.md, backgroundColor: '#0E0C1A', paddingHorizontal: 14, paddingVertical: 16, gap: 12, marginTop: 16 },
  formHeading: {
    ...typography.h2,
  },
  formIntro: {
    ...typography.bodySm,
  },
  field: { gap: 6 },
  fieldLabel: {
    ...typography.label,
  },
  input: {
    ...typography.input,
    color: '#FFFAFF',
    backgroundColor: 'rgba(5,4,11,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldHint: {
    ...typography.bodySm,
  },

  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: {
    minHeight: 30,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catPillActive: { borderColor: 'transparent' },
  catLabel: {
    ...typography.bodySm,
  },
  catLabelActive: { color: '#FFFFFF' },

  textarea: {

    ...typography.input,
    color: '#FFFAFF',
    minHeight: 72,
    backgroundColor: 'rgba(5,4,11,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,

  },

  // Reward menu (web .golive-rewards)
  rewards: { gap: 6, paddingTop: 10, marginTop: 2, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  rewardsHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardsTitle: {
    ...typography.h3,
  },
  rewardsIntro: {
    ...typography.bodySm,
  },
  rewardSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    marginTop: 2,
  },
  rewardSummaryText: {
    ...typography.bodySm,
    flex: 1,
  },
  manageBtn: {
    flexShrink: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  manageBtnText: {
    ...typography.bodySm,
  },

  // Go Live (web .golive-submit)
  cta: {
    height: 50,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaLabel: {
    ...typography.button,
  },
  submitCaption: {
    ...typography.bodySm,
  },
  ctaNoteGreen: {
    ...typography.bodySm,
  },
});

export default GoLiveScreen;
