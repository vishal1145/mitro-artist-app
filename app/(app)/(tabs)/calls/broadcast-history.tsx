import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Header, InfoCallout, ListRow, Screen, StatTile } from '@components/shared';
import { Card, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

const PAST = [
  { id: 'bc_001', title: 'Midnight Synth Session', when: 'Aug 17 · 12m', viewers: '342', earned: '+145 tk' },
  { id: 'bc_002', title: 'Acoustic Chill Session', when: 'Aug 14 · 1h 20m', viewers: '890', earned: '+85 tk' },
  { id: 'bc_003', title: 'Weekly Q&A #12', when: 'Aug 10 · 30m', viewers: '2.1K', earned: '+320 tk' },
];

/** Section heading with a leading icon. */
const SectionTitle = ({
  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: string;
}) => (
  <View style={styles.sectionTitle}>
    <Ionicons name={icon} size={rf(16)} color={colors.primary} />
    <Text variant="h3">{children}</Text>
  </View>
);

/**
 * Broadcast history — solo broadcasts only. Private-call availability,
 * pending call requests and call history live in the PrivateCalls route.
 */
const BroadcastHistoryScreen = () => {
  const router = useRouter();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Broadcast History" onBack={() => router.back()} />

      <InfoCallout
        tone="neutral"
        icon="information-circle-outline"
        linkLabel="Learn more about session analytics"
      >
        <Text variant="caption" color="textSecondary">
          This is the full record of every{' '}
          <Text variant="caption" color="onSurface" style={styles.bold}>
            solo broadcast
          </Text>{' '}
          you&apos;ve hosted, with peak viewers and earnings.{' '}
        </Text>
      </InfoCallout>

      {/* Stats */}
      <View style={styles.grid}>
        <StatTile icon="radio-outline" label="SHOWS" value="12" tint={colors.textSecondary} />
        <StatTile
          icon="sparkles-outline"
          label="TOTAL EARNED"
          value="1.2k"
          unit="tk"
          tint={colors.warning}
        />
      </View>
      <View style={styles.grid}>
        <StatTile icon="people-outline" label="UNIQUE VIEWERS" value="845" tint={colors.success} />
        <StatTile icon="time-outline" label="AVG LENGTH" value="45m" tint={colors.textSecondary} />
      </View>

      {/* Fulfill rewards callout */}
      <View style={styles.accentCard}>
        <Text variant="label" color="warning" style={styles.accentTitle}>
          FULFILL REWARDS PROMPTLY
        </Text>
        <Text variant="caption" color="textSecondary">
          Fans notice when a shoutout or song request never arrives, and that erodes trust fast.
          Quick delivery keeps fans confident enough to tip and book again.
        </Text>
      </View>

      {/* Pending reward deliveries */}
      <Card style={styles.section}>
        <SectionTitle icon="checkmark-circle-outline">Pending Reward Deliveries</SectionTitle>
        <View style={styles.empty}>
          <EmptyState
            icon="mail-open-outline"
            title="No rewards waiting on delivery right now."
            actionLabel="View all rewards"
            onAction={() => router.push('/(app)/(tabs)/home/reward-fulfillment')}
          />
        </View>
      </Card>

      {/* Past broadcasts */}
      <SectionTitle icon="time-outline">Past Broadcasts</SectionTitle>
      {PAST.length ? (
        <Card style={styles.pastCard}>
          {PAST.map((b, i) => (
            <ListRow
              key={b.id}
              icon="radio-outline"
              iconTint={colors.primary}
              title={b.title}
              subtitle={`${b.when} · ${b.viewers} viewers`}
              right={
                <Text variant="link" color="warning">
                  {b.earned}
                </Text>
              }
              divider={i > 0}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/home/broadcast-detail',
                  params: { broadcastId: b.id },
                })
              }
            />
          ))}
        </Card>
      ) : (
        <Card>
          <View style={styles.empty}>
            <EmptyState
              icon="radio-outline"
              title="No past broadcasts yet."
              description="Your solo broadcasts will appear here once you go live."
            />
          </View>
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
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
  },
  section: {
    gap: spacing.md,
  },
  accentCard: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    borderLeftWidth: wp(1),
    borderLeftColor: colors.warning,
    padding: spacing.md,
    gap: spacing.xs,
  },
  accentTitle: {
    letterSpacing: 1.1,
  },
  empty: {
    minHeight: wp(45),
    paddingVertical: spacing.lg,
  },
  pastCard: {
    paddingVertical: 0,
    paddingHorizontal: spacing.md,
  },
});

export default BroadcastHistoryScreen;
