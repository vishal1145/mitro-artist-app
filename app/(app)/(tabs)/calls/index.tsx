import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EarningsBar, Screen } from '@components/shared';
import { Text } from '@components/ui';
import { useGroupCallHistorySummary } from '@hooks/useGroupCallHistory';
import { useBroadcastHistorySummary } from '@hooks/useInsights';
import { useProfile } from '@hooks/useProfile';
import { useVerificationGate } from '@hooks/useVerificationGate';
import { useNotificationStore } from '@store';
import { colors, fontFamily, gradientDirection, gradients, layout, radius, typography } from '@theme';
import { grouped } from '@utils/format';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

type Href =
  | '/(app)/(tabs)/calls/group-call-history'
  | '/(app)/(tabs)/calls/private-calls'
  | '/(app)/(tabs)/calls/broadcast-history';

/** Sub-line split so the highlighted fragment can carry its own colour. */
interface Sub {
  lead: string;
  strong?: string;
  strongColor?: 'pink' | 'cyan';
  tail?: string;
}

interface Entry {
  icon: FeatherIconName;
  tint: string;
  fill: string;
  title: string;
  route: Href;
  sub: Sub;
}

/**
 * Static half of each row — icon, colour, label, destination.
 *
 * No seeded sub-line: every figure below comes from the API, so there is
 * nothing here to fall back to and nothing that could flash a stale number
 * before the real one lands.
 */
const ENTRIES: Omit<Entry, 'sub'>[] = [
  {
    icon: 'users',
    tint: colors.pink,
    fill: colors.pinkSoft,
    title: 'Group Sessions',
    route: '/(app)/(tabs)/calls/group-call-history',
  },
  {
    icon: 'phone',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Private Calls',
    route: '/(app)/(tabs)/calls/private-calls',
  },
  {
    icon: 'video',
    tint: colors.cyan,
    fill: colors.cyanSoft,
    title: 'Broadcasts',
    route: '/(app)/(tabs)/calls/broadcast-history',
  },
];

/** Calls tab root — the hub for sessions, private calls and broadcasts. */
const CallsHubScreen = () => {
  const router = useRouter();
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);

  // Same summaries the web reads on its history screens + the artist profile.
  const { data: gcSummary } = useGroupCallHistorySummary('all');
  const { data: bcSummary } = useBroadcastHistorySummary();
  const { data: profile } = useProfile();
  // Private Calls and Schedule are two of web's three gated destinations; the
  // history rows beside them are read-only and stay open.
  const { guard } = useVerificationGate();

  // Each sub-line is built from live data only. While a summary is still in
  // flight its row shows an em dash rather than a plausible-looking number.
  const subFor = (title: string): Sub => {
    if (title === 'Group Sessions') {
      return {
        lead: gcSummary
          ? `${grouped(gcSummary.totalCalls)} hosted · ${grouped(gcSummary.totalRevenueTokens)} coins`
          : '—',
      };
    }
    if (title === 'Private Calls') {
      if (!profile) {
        return { lead: '—' };
      }
      const on = profile.acceptsPrivateCalls;
      return { lead: 'Currently ', strong: on ? 'ON' : 'OFF', strongColor: on ? 'cyan' : 'pink' };
    }
    if (title === 'Broadcasts') {
      return bcSummary
        ? {
            lead: `${grouped(bcSummary.totalShows)} shows · `,
            strong: grouped(bcSummary.totalUniqueViewers),
            strongColor: 'cyan',
            tail: ' viewers',
          }
        : { lead: '—' };
    }
    return { lead: '—' };
  };

  const entries: Entry[] = ENTRIES.map((entry) => ({ ...entry, sub: subFor(entry.title) }));

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
          onPress={() => guard(() => router.push('/(app)/(tabs)/calls/schedule-session'))}
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

      {/* Areas */}
      <View style={styles.entries}>
        {entries.map((entry) => (
          <Pressable
            key={entry.title}
            style={styles.entry}
            onPress={() => {
              const go = () => router.push(entry.route);
              if (entry.route === '/(app)/(tabs)/calls/private-calls') {
                guard(go);
              } else {
                go();
              }
            }}
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
    ...typography.label,
    color: colors.white,
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

});

export default CallsHubScreen;
