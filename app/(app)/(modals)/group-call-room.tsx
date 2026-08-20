import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf, SCREEN } from '@utils/responsive';

/**
 * Tile dimensions are computed in pixels rather than percentages — percentage
 * widths combined with aspectRatio collapse to zero height inside a wrapping
 * ScrollView content container.
 */
const GRID_GAP = 12;
const FULL_W = SCREEN.width - layout.screenPadding * 2;
const HALF_W = (FULL_W - GRID_GAP) / 2;
const STAGE_H = FULL_W * 0.62;

interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  muted: boolean;
  speaking?: boolean;
  camOff?: boolean;
}

const HOST = { name: 'Alex Nova', initials: 'AN' };

const PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Sarah J.', initials: 'SJ', color: colors.green, muted: false, speaking: true },
  { id: 'p2', name: 'Mike (Cam Off)', initials: 'M', color: colors.cardRaised, muted: true, camOff: true },
  { id: 'p3', name: 'ER', initials: 'ER', color: colors.violet, muted: true },
  { id: 'p4', name: 'DK', initials: 'DK', color: colors.cyan, muted: false },
];

const SEATS = 10;
const RATE = 8;

/** mm:ss elapsed formatter. */
const formatElapsed = (total: number): string => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const GroupCallRoomScreen = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [elapsed, setElapsed] = useState(42 * 60 + 26);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const filled = PARTICIPANTS.length + 1;

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /**
   * Dismiss the modal rather than replacing into a tab route. Replacing pushed
   * Group Sessions onto the Calls stack, so re-entering the tab landed there
   * instead of the hub — and it stayed that way for the rest of the session.
   */
  const leave = () => {
    setConfirmingLeave(false);
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(app)/(tabs)/calls');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => setConfirmingLeave(true)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Leave session"
        >
          <Feather name="chevron-left" size={rf(20)} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerText}>
          <View style={styles.headerTitleRow}>
            <Text variant="h3" numberOfLines={1}>
              Late Night Q&amp;A
            </Text>
            <View style={styles.groupPill}>
              <Text variant="label" color="violet">
                GROUP CALL
              </Text>
            </View>
          </View>

          <View style={styles.headerMeta}>
            <Feather name="clock" size={rf(12)} color={colors.textMuted} />
            <Text variant="bodySm" color="textMuted">
              {formatElapsed(elapsed)}
            </Text>
            <Feather name="users" size={rf(12)} color={colors.textMuted} />
            <Text variant="bodySm" color="textMuted">
              {filled}/{SEATS}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Session chat"
        >
          <Feather name="message-circle" size={rf(17)} color={colors.textPrimary} />
          <View style={styles.badgeDot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Host stage */}
        <View style={styles.stage}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text variant="label" color="pink">
              LIVE
            </Text>
          </View>

          <View style={styles.hostPill}>
            <Text variant="label" color="gold">
              HOST
            </Text>
          </View>

          <Avatar initials={HOST.initials} name={HOST.name} size="xl" />
          <Text variant="bodyLg" color="textPrimary" style={styles.stageName}>
            {HOST.name}
          </Text>
        </View>

        {/* Participants */}
        <View style={styles.grid}>
          {PARTICIPANTS.map((p) => (
            <View key={p.id} style={[styles.tile, p.speaking ? styles.tileSpeaking : null]}>
              {p.speaking ? (
                <Text variant="label" color="green" style={styles.speakingTag}>
                  SPEAKING
                </Text>
              ) : null}

              <Avatar initials={p.initials} name={p.name} size="md" color={p.color} />
              <Text
                variant="bodySm"
                color={p.camOff ? 'textMuted' : 'textPrimary'}
                style={styles.tileName}
                numberOfLines={1}
              >
                {p.name}
              </Text>

              <View style={[styles.micChip, p.muted ? styles.micChipMuted : null]}>
                <Feather
                  name={p.muted ? 'mic-off' : 'mic'}
                  size={rf(12)}
                  color={p.muted ? colors.red : colors.green}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Rate strip */}
        <View style={styles.rateStrip}>
          <Feather name="award" size={rf(13)} color={colors.green} />
          <Text variant="label" color="green">
            {RATE} TK/MIN · {filled} SEATS FILLED
          </Text>
        </View>

      </ScrollView>

      {/* Floating control dock */}
      <View style={styles.dock}>
        <Pressable
          style={styles.ctrlBtn}
          onPress={() => setMicOn((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          <Feather
            name={micOn ? 'mic' : 'mic-off'}
            size={rf(19)}
            color={micOn ? colors.textPrimary : colors.red}
          />
        </Pressable>

        <Pressable
          style={styles.ctrlBtn}
          onPress={() => setCamOn((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={camOn ? 'Turn camera off' : 'Turn camera on'}
        >
          <Feather
            name={camOn ? 'video' : 'video-off'}
            size={rf(19)}
            color={camOn ? colors.textPrimary : colors.red}
          />
        </Pressable>

        <Pressable
          style={styles.ctrlBtn}
          accessibilityRole="button"
          accessibilityLabel={`Participants, ${filled} in the room`}
        >
          <Feather name="users" size={rf(19)} color={colors.textPrimary} />
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filled}</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.endBtn}
          onPress={() => setConfirmingLeave(true)}
          accessibilityRole="button"
          accessibilityLabel={`End session ${sessionId ?? ''}`}
        >
          <Feather name="phone" size={rf(22)} color={colors.white} style={styles.endIcon} />
        </Pressable>
      </View>

      <ConfirmDialog
        visible={confirmingLeave}
        icon="log-out"
        title="Leave session?"
        message="Attendees will stay in the room until you end it."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={leave}
        onCancel={() => setConfirmingLeave(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screen,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 10,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupPill: {
    backgroundColor: colors.violetSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },

  scroll: {
    paddingHorizontal: layout.screenPadding,
    // Clears the floating dock.
    paddingBottom: 110,
  },

  // Host stage — pink ring marks who the room is here for.
  stage: {
    width: FULL_W,
    height: STAGE_H,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderHot,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  livePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.pinkSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pink,
  },
  hostPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stageName: {
    fontFamily: fontFamily.bold,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginTop: GRID_GAP,
  },
  tile: {
    width: HALF_W,
    height: HALF_W * 0.86,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tileSpeaking: {
    borderColor: colors.green,
  },
  speakingTag: {
    position: 'absolute',
    top: 8,
    left: 10,
  },
  tileName: {
    fontFamily: fontFamily.bold,
    paddingHorizontal: 10,
  },
  micChip: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.successChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micChipMuted: {
    backgroundColor: colors.errorSoft,
  },

  rateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.successChip,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.pill,
    paddingVertical: 12,
    marginTop: 18,
  },
  note: {
    marginTop: 14,
  },

  dock: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  ctrlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(9),
    color: colors.white,
  },
  endBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  // Hang-up is the phone glyph rotated 135°.
  endIcon: {
    transform: [{ rotate: '135deg' }],
  },
});

export default GroupCallRoomScreen;
