import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ListRow, Screen } from '@components/shared';
import { Avatar, Button, Card, GradientButton, Text } from '@components/ui';
import { colors, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

const STATS: { icon: FeatherIconName; label: string; value: string }[] = [
  { icon: 'eye', label: 'PEAK VIEWERS', value: '1,204' },
  { icon: 'message-circle', label: 'MESSAGES', value: '348' },
  { icon: 'user-plus', label: 'NEW FOLLOWERS', value: '52' },
  { icon: 'gift', label: 'REWARDS', value: '18' },
];

const SUPPORTERS: {
  initials: string;
  name: string;
  amount: string;
  tag: string;
  tagIcon: FeatherIconName;
  tagTint: string;
  top?: boolean;
}[] = [
  { initials: 'JD', name: 'Jaxon D.', amount: '300 TK', tag: 'MVP', tagIcon: 'star', tagTint: colors.warning, top: true },
  { initials: 'SV', name: 'Sarah V.', amount: '150 TK', tag: 'HYPE', tagIcon: 'zap', tagTint: colors.primary },
  { initials: 'MR', name: 'Mike R.', amount: '84 TK', tag: 'SONG', tagIcon: 'music', tagTint: colors.success },
];

const BroadcastSummaryScreen = () => {
  const router = useRouter();
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();

  /** Leaving the summary always resets to the dashboard — the stream is over. */
  const toDashboard = () => router.replace('/(app)/(tabs)/home');

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* Close */}
      <View style={styles.closeRow}>
        <Pressable
          onPress={toDashboard}
          style={styles.closeBtn}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel="Close summary"
        >
          <Feather name="x" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Headline */}
      <View style={styles.headline}>
        <Text variant="display" align="center" style={styles.headlineTitle}>
          That&apos;s a wrap!
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          Friday Night Freestyle · 42 min
        </Text>
      </View>

      {/* Earnings hero */}
      <Card style={styles.hero}>
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />
        <Text variant="display" color="primary" style={styles.heroValue}>
          +674
        </Text>
        <Text variant="label" color="success" style={styles.heroUnit}>
          TK EARNED
        </Text>
      </Card>

      {/* Stat grid */}
      <View style={styles.grid}>
        {STATS.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <View style={styles.statTop}>
              <Feather name={s.icon} size={rf(15)} color={colors.textSecondary} />
              <Text variant="label" color="textSecondary" numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            <Text variant="h2" style={styles.statValue}>
              {s.value}
            </Text>
          </Card>
        ))}
      </View>

      {/* Top supporters */}
      <Card style={styles.section}>
        <Text variant="h3">Top Supporters</Text>
        {SUPPORTERS.map((s) => (
          <ListRow
            key={s.initials}
            left={
              <Avatar
                initials={s.initials}
                name={s.name}
                size="md"
                color={s.top ? colors.primaryDark : colors.surfaceElevated}
              />
            }
            title={s.name}
            subtitle={s.amount}
            chevron={false}
            right={
              <View style={styles.tag}>
                <Feather name={s.tagIcon} size={rf(12)} color={s.tagTint} />
                <Text variant="label" color="textSecondary">
                  {s.tag}
                </Text>
              </View>
            }
          />
        ))}
      </Card>

      {/* Pending rewards nudge */}
      <View style={styles.nudge}>
        <View style={styles.nudgeAccent} />
        <View style={styles.nudgeBody}>
          <Feather name="alert-triangle" size={rf(17)} color={colors.warning} />
          <View style={styles.nudgeText}>
            <Text variant="link" color="textPrimary">
              3 rewards waiting on delivery
            </Text>
            <Text variant="caption" color="textSecondary">
              Viewers are waiting for shoutouts.
            </Text>
          </View>
          <Pressable
            style={styles.nudgeBtn}
            onPress={() => router.replace('/(app)/(tabs)/home/reward-fulfillment')}
            accessibilityRole="button"
            accessibilityLabel="Fulfill rewards now"
          >
            <Text variant="label" color="textPrimary">
              Fulfill now
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <GradientButton
          label="Back to Dashboard"
          gradient="forgot"
          textColor="ctaDark"
          onPress={toDashboard}
        />
        <Button
          label="View full analytics"
          variant="ghost"
          onPress={() =>
            router.replace({
              pathname: '/(app)/(tabs)/home/broadcast-detail',
              params: { broadcastId: broadcastId ?? 'bc_live' },
            })
          }
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  closeRow: {
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  headlineTitle: {
    fontSize: rf(28),
  },

  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    overflow: 'hidden',
  },
  heroGlowTop: {
    position: 'absolute',
    top: -wp(6),
    left: -wp(6),
    width: wp(30),
    height: wp(30),
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -wp(8),
    right: -wp(8),
    width: wp(34),
    height: wp(34),
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
  },
  heroValue: {
    fontSize: rf(35),
  },
  heroUnit: {
    letterSpacing: 1.8,
    marginTop: spacing.xxs,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: rf(18),
  },

  section: {
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },

  nudge: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  nudgeAccent: {
    width: wp(1),
    backgroundColor: colors.warning,
  },
  nudgeBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  nudgeText: {
    flex: 1,
    gap: spacing.xxs,
  },
  nudgeBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

export default BroadcastSummaryScreen;
