import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Header, InfoCallout, ListRow, Screen, StatTile } from '@components/shared';
import { Badge, Card, GradientButton, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Session {
  id: string;
  title: string;
  when: string;
  seats: string;
  earned: string;
  live?: boolean;
}

const UPCOMING: Session[] = [
  { id: 'gs_101', title: 'Mixing Masterclass: Vocals', when: 'Today · 7:00 PM', seats: '8 / 10 seats', earned: '4,000 tk', live: true },
  { id: 'gs_102', title: 'Songwriting Q&A', when: 'Aug 21 · 6:30 PM', seats: '3 / 12 seats', earned: '1,500 tk' },
];

const PAST: Session[] = [
  { id: 'gs_098', title: 'Beat Lab: Lo-fi Textures', when: 'Aug 14 · 45m', seats: '10 / 10 seats', earned: '5,000 tk' },
  { id: 'gs_094', title: 'Live Feedback Round', when: 'Aug 09 · 60m', seats: '7 / 10 seats', earned: '3,500 tk' },
];

/** Section heading with a leading icon. */
const SectionTitle = ({ icon, children }: { icon: IoniconName; children: string }) => (
  <View style={styles.sectionTitle}>
    <Ionicons name={icon} size={rf(16)} color={colors.primary} />
    <Text variant="h3">{children}</Text>
  </View>
);

/**
 * Group sessions — upcoming scheduled calls to start, plus past session history.
 * NOTE: the Stitch export has no group-call screen, so this follows the app's
 * established patterns and the route table (start -> GroupCallRoom { sessionId }).
 */
const GroupCallHistoryScreen = () => {
  const router = useRouter();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Group Sessions" onBack={() => router.back()} />

      <InfoCallout tone="neutral" icon="information-circle-outline">
        <Text variant="caption" color="textSecondary">
          Every{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            paid group session
          </Text>{' '}
          you&apos;ve scheduled. Start one when its time arrives — attendees join the room straight
          away.
        </Text>
      </InfoCallout>

      {/* Stats */}
      <View style={styles.grid}>
        <StatTile icon="people-outline" label="SESSIONS" value="9" tint={colors.primary} />
        <StatTile icon="sparkles-outline" label="TOTAL EARNED" value="14.2k" unit="tk" tint={colors.warning} />
      </View>

      {/* Upcoming */}
      <SectionTitle icon="calendar-outline">Upcoming</SectionTitle>
      {UPCOMING.map((s) => (
        <Card key={s.id} style={styles.sessionCard}>
          <View style={styles.sessionHead}>
            <View style={styles.sessionText}>
              <Text variant="link" color="textPrimary" numberOfLines={1}>
                {s.title}
              </Text>
              <Text variant="caption" color="textMuted">
                {s.when} · {s.seats}
              </Text>
            </View>
            <Badge label={s.earned} tone="success" />
          </View>

          <GradientButton
            label={s.live ? 'Start session' : 'Starts later'}
            gradient="cta"
            textColor="ctaDark"
            leftIcon="videocam"
            disabled={!s.live}
            onPress={() =>
              router.push({
                pathname: '/(app)/(modals)/group-call-room',
                params: { sessionId: s.id },
              })
            }
          />
        </Card>
      ))}

      {/* Past */}
      <SectionTitle icon="time-outline">Past sessions</SectionTitle>
      <Card style={styles.pastCard}>
        {PAST.map((s, i) => (
          <ListRow
            key={s.id}
            icon="people-outline"
            title={s.title}
            subtitle={`${s.when} · ${s.seats}`}
            right={
              <Text variant="link" color="warning">
                {s.earned}
              </Text>
            }
            divider={i > 0}
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/home/broadcast-detail',
                params: { broadcastId: s.id },
              })
            }
          />
        ))}
      </Card>

      {PAST.length === 0 ? (
        <Card>
          <View style={styles.empty}>
            <EmptyState
              icon="people-outline"
              title="No past sessions yet."
              description="Scheduled group sessions will appear here once they finish."
            />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sessionCard: {
    gap: spacing.md,
  },
  sessionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sessionText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pastCard: {
    paddingVertical: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  empty: {
    minHeight: wp(40),
    paddingVertical: spacing.lg,
  },
});

export default GroupCallHistoryScreen;
