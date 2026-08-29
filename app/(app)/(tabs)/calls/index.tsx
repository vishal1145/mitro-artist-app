import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  EarningsBar,
  InsightLine,
  ProgressBar,
  Screen,
  SectionLabel,
} from '@components/shared';
import { Text } from '@components/ui';
import { useNotificationStore } from '@store';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

type Href =
  | '/(app)/(tabs)/calls/group-call-history'
  | '/(app)/(tabs)/calls/private-calls'
  | '/(app)/(tabs)/calls/broadcast-history';

interface Entry {
  icon: FeatherIconName;
  tint: string;
  fill: string;
  title: string;
  route: Href;
  /** Sub-line split so the highlighted fragment can carry its own colour. */
  sub: { lead: string; strong?: string; strongColor?: 'pink' | 'cyan'; tail?: string };
}

const ENTRIES: Entry[] = [
  {
    icon: 'users',
    tint: colors.pink,
    fill: colors.pinkSoft,
    title: 'Group Sessions',
    route: '/(app)/(tabs)/calls/group-call-history',
    sub: { lead: '9 hosted · 14.2k tk' },
  },
  {
    icon: 'phone',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Private Calls',
    route: '/(app)/(tabs)/calls/private-calls',
    sub: { lead: 'Currently ', strong: 'OFF', strongColor: 'pink' },
  },
  {
    icon: 'video',
    tint: colors.cyan,
    fill: colors.cyanSoft,
    title: 'Broadcasts',
    route: '/(app)/(tabs)/calls/broadcast-history',
    sub: {
      lead: '12 shows · ',
      strong: '845',
      strongColor: 'cyan',
      tail: ' viewers',
    },
  },
];

/** Next scheduled session, surfaced so the artist can start it in one tap. */
const UP_NEXT = {
  id: 'gs_101',
  title: 'Mixing Masterclass: Vocals',
  when: 'Today 7:00 PM',
  seats: '8/10 seats',
  price: '4,000 tk',
  filled: 8,
  total: 10,
};

/** Calls tab root — the hub for sessions, private calls and broadcasts. */
const CallsHubScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);
  const seatsLeft = UP_NEXT.total - UP_NEXT.filled;

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread={hasUnread}
        />
      }
    >

      {/* Title + schedule CTA */}
      <View style={styles.titleRow}>
        <Text variant="h1" style={styles.title}>
          Sessions &amp; Calls
        </Text>

        <Pressable
          onPress={() => router.push('/(app)/(tabs)/calls/schedule-session')}
          accessibilityRole="button"
          accessibilityLabel="Schedule a session"
          style={styles.scheduleBtn}
        >
          <LinearGradient
            colors={gradients.cta}
            start={gradientDirection.horizontal.start}
            end={gradientDirection.horizontal.end}
            style={styles.scheduleFill}
          >
            <Feather name="plus" size={rf(15)} color={colors.white} />
            <Text style={styles.scheduleLabel}>SCHEDULE</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <InsightLine
        style={styles.insight}
        lead="Mixing Masterclass starts 7 PM"
        tail=" — 2 seats left"
      />

      {/* Areas */}
      <View style={styles.entries}>
        {ENTRIES.map((entry) => (
          <Pressable
            key={entry.title}
            style={styles.entry}
            onPress={() => router.push(entry.route)}
            accessibilityRole="button"
            accessibilityLabel={entry.title}
          >
            <View style={[styles.entryIcon, { backgroundColor: entry.fill }]}>
              <Feather name={entry.icon} size={rf(18)} color={entry.tint} />
            </View>

            <View style={styles.entryText}>
              <Text variant="h3">{entry.title}</Text>
              <Text variant="bodySm" color="textMuted">
                {entry.sub.lead}
                {entry.sub.strong ? (
                  <Text
                    variant="bodySm"
                    color={entry.sub.strongColor ?? 'pink'}
                    style={styles.strong}
                  >
                    {entry.sub.strong}
                  </Text>
                ) : null}
                {entry.sub.tail}
              </Text>
            </View>

            <Feather name="chevron-right" size={rf(16)} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <SectionLabel divider style={styles.sectionLabel}>
        UP NEXT
      </SectionLabel>

      {/* Next session — highlighted so the primary action is unmissable */}
      <View style={styles.upNext}>
        <View style={styles.startsRow}>
          <View style={styles.startsDot} />
          <Text variant="label" color="pink">
            STARTS TODAY
          </Text>
        </View>

        <Text variant="h3" style={styles.upNextTitle}>
          {UP_NEXT.title}
        </Text>

        <Text variant="bodySm" color="textMuted" style={styles.upNextMeta}>
          {UP_NEXT.when} · {UP_NEXT.seats} ·{' '}
          <Text variant="bodySm" color="gold" style={styles.strong}>
            {UP_NEXT.price}
          </Text>
        </Text>

        <View style={styles.seatRow}>
          <ProgressBar value={UP_NEXT.filled / UP_NEXT.total} />
          <Text variant="bodySm" color="textMuted">
            {seatsLeft} seats left
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(app)/(modals)/group-call-room',
              params: { sessionId: UP_NEXT.id },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Start ${UP_NEXT.title}`}
          style={styles.startBtn}
        >
          <LinearGradient
            colors={gradients.cta}
            start={gradientDirection.horizontal.start}
            end={gradientDirection.horizontal.end}
            style={styles.startFill}
          >
            <Feather name="play" size={rf(15)} color={colors.white} />
            <Text style={styles.startLabel}>Start session</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  title: {
    flex: 1,
  },
  scheduleBtn: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  scheduleFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  scheduleLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.8,
    color: colors.white,
  },
  insight: {
    marginTop: 16,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },

  entries: {
    gap: 12,
    marginTop: 24,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: {
    flex: 1,
    gap: 3,
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 12,
  },

  // Pink-bordered card with a soft glow — the one thing to act on right now.
  upNext: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderHot,
    borderRadius: radius.card,
    padding: 18,
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  startsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
  upNextTitle: {
    marginTop: 10,
  },
  upNextMeta: {
    marginTop: 4,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  startBtn: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 18,
  },
  startFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  startLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.white,
  },
});

export default CallsHubScreen;
