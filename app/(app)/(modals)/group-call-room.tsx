import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Text } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf, wp, SCREEN } from '@utils/responsive';

/**
 * Tile dimensions are computed in pixels rather than percentages — percentage
 * widths combined with aspectRatio collapse to zero height inside a wrapping
 * ScrollView content container.
 */
const GRID_PADDING = spacing.md;
const GRID_GAP = spacing.xs;
const FULL_W = SCREEN.width - GRID_PADDING * 2;
const HALF_W = (FULL_W - GRID_GAP) / 2;
const HOST_H = FULL_W * 0.75;

interface Participant {
  id: string;
  name: string;
  initials: string;
  muted: boolean;
  camOff?: boolean;
  speaking?: boolean;
}

const HOST = { name: 'Alex Nova', initials: 'AN' };

const PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Sarah J.', initials: 'SJ', muted: false, speaking: true },
  { id: 'p2', name: 'Mike (Cam Off)', initials: 'MK', muted: true, camOff: true },
  { id: 'p3', name: 'Elena R.', initials: 'ER', muted: true },
  { id: 'p4', name: 'David K.', initials: 'DK', muted: false },
];

const SEATS = 10;

/** mm:ss elapsed formatter. */
const formatElapsed = (total: number): string => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const GroupCallRoomScreen = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [elapsed, setElapsed] = useState(42 * 60 + 15);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const filled = PARTICIPANTS.length + 1;

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const confirmLeave = () => {
    Alert.alert('Leave session?', 'Attendees will stay in the room until you end it.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => router.replace('/(app)/(tabs)/calls/group-call-history'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={confirmLeave}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Leave session"
        >
          <Ionicons name="chevron-back" size={rf(20)} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerText}>
          <View style={styles.headerTitleRow}>
            <Text variant="h3" numberOfLines={1}>
              Late Night Q&amp;A
            </Text>
            <View style={styles.groupPill}>
              <Text variant="label" color="primary">
                GROUP CALL
              </Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Ionicons name="timer-outline" size={rf(13)} color={colors.textMuted} />
            <Text variant="label" color="textMuted">
              {formatElapsed(elapsed)}
            </Text>
            <View style={styles.metaDot} />
            <Ionicons name="people-outline" size={rf(13)} color={colors.textMuted} />
            <Text variant="label" color="textMuted">
              {filled}/{SEATS}
            </Text>
          </View>
        </View>

        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Session chat">
          <Ionicons name="chatbubble-outline" size={rf(18)} color={colors.textPrimary} />
          <View style={styles.badgeDot} />
        </Pressable>
      </View>

      {/* Tiles */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {/* Host — full width */}
        <View style={[styles.tile, styles.hostTile]}>
          <View style={styles.videoFill}>
            <Avatar initials={HOST.initials} name={HOST.name} size="lg" />
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text variant="label" color="success">
              LIVE
            </Text>
          </View>
          <View style={styles.hostTag}>
            <Text variant="label" color="primary">
              HOST
            </Text>
          </View>
          <Text variant="link" color="white" style={styles.tileName}>
            {HOST.name}
          </Text>
        </View>

        {/* Participants */}
        {PARTICIPANTS.map((p) => (
          <View
            key={p.id}
            style={[styles.tile, styles.squareTile, p.speaking ? styles.speaking : null]}
          >
            <View style={styles.videoFill}>
              <Avatar
                initials={p.initials}
                name={p.name}
                size="md"
                color={p.camOff ? colors.surfaceElevated : colors.primaryDark}
              />
            </View>
            <View style={[styles.micTag, p.muted ? styles.micTagMuted : null]}>
              <Ionicons
                name={p.muted ? 'mic-off' : 'mic'}
                size={rf(13)}
                color={p.muted ? colors.error : colors.textPrimary}
              />
            </View>
            <Text
              variant="caption"
              color={p.camOff ? 'textSecondary' : 'white'}
              style={styles.tileName}
              numberOfLines={1}
            >
              {p.name}
            </Text>
          </View>
        ))}

        {/* Empty seat — rendered in full (cut off in the export) */}
        <Pressable
          style={[styles.tile, styles.squareTile, styles.emptySeat]}
          accessibilityRole="button"
          accessibilityLabel="Invite someone to the empty seat"
        >
          <View style={styles.emptyIcon}>
            <Ionicons name="person-add-outline" size={rf(20)} color={colors.textMuted} />
          </View>
          <Text variant="caption" color="textMuted">
            Waiting
          </Text>
        </Pressable>
      </ScrollView>

      {/* Rate pill */}
      <View style={styles.ratePill}>
        <Ionicons name="diamond-outline" size={rf(15)} color={colors.successBg} />
        <Text variant="label" color="successBg">
          8 tk/min · {filled} seats filled
        </Text>
      </View>

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

        <Pressable style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Participants">
          <Ionicons name="people" size={rf(20)} color={colors.textPrimary} />
          <View style={styles.countBadge}>
            <Text variant="label" color="ctaDark" style={styles.countText}>
              {filled}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.endBtn}
          onPress={confirmLeave}
          accessibilityRole="button"
          accessibilityLabel={`End session ${sessionId ?? ''}`}
        >
          <Ionicons name="call" size={rf(24)} color={colors.errorBg} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  groupPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDot: {
    width: wp(1),
    height: wp(1),
    borderRadius: radius.full,
    backgroundColor: colors.textMuted,
  },
  iconBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: wp(3),
    height: wp(3),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    padding: GRID_PADDING,
  },
  tile: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  hostTile: {
    width: FULL_W,
    height: HOST_H,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  squareTile: {
    width: HALF_W,
    height: HALF_W,
  },
  speaking: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  videoFill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.chipSurfaceStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  liveDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  hostTag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  micTag: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: wp(7),
    height: wp(7),
    borderRadius: radius.full,
    backgroundColor: colors.chipSurfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micTagMuted: {
    backgroundColor: colors.errorSoft,
  },
  tileName: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    right: spacing.sm,
  },

  emptySeat: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  emptyIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  ctrlBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -wp(1),
    right: -wp(1),
    minWidth: wp(5),
    height: wp(5),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  countText: {
    fontSize: rf(9),
  },
  endBtn: {
    width: wp(14),
    height: wp(14),
    borderRadius: radius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GroupCallRoomScreen;
