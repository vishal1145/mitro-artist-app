import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen, SectionLabel } from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout, radius } from '@theme';
import { pressable } from '@utils/press';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;

const STATS: { icon: FeatherIconName; label: string; value: string }[] = [
  { icon: 'eye', label: 'Peak viewers', value: '1,204' },
  { icon: 'message-circle', label: 'Messages', value: '348' },
  { icon: 'user-plus', label: 'New followers', value: '52' },
  { icon: 'gift', label: 'Rewards', value: '18' },
];

const SUPPORTERS: {
  initials: string;
  name: string;
  amount: string;
  tag: string;
  tagIcon: FeatherIconName;
  tagTint: string;
  color: string;
}[] = [
  {
    initials: 'JD',
    name: 'Jaxon D.',
    amount: '300 tk',
    tag: 'MVP',
    tagIcon: 'star',
    tagTint: colors.gold,
    color: colors.violet,
  },
  {
    initials: 'SV',
    name: 'Sarah V.',
    amount: '150 tk',
    tag: 'HYPE',
    tagIcon: 'zap',
    tagTint: colors.pink,
    color: colors.pink,
  },
  {
    initials: 'MR',
    name: 'Mike R.',
    amount: '84 tk',
    tag: 'SONG',
    tagIcon: 'music',
    tagTint: colors.green,
    color: colors.cyan,
  },
];

/** Post-stream recap. Flat sections — the numbers carry the page, not boxes. */
const BroadcastSummaryScreen = () => {
  const router = useRouter();
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();

  /** Leaving the summary always resets to the dashboard — the stream is over. */
  const toDashboard = () => router.replace('/(app)/(tabs)/home');

  return (
    <Screen scrollable padded={false} contentContainerStyle={styles.content}>
      <View style={styles.closeRow}>
        <Pressable
          onPress={toDashboard}
          style={pressable(styles.closeBtn)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close summary"
        >
          <Feather name="x" size={rf(18)} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Headline */}
      <Text variant="numHero" align="center">
        That&apos;s a wrap!
      </Text>
      <Text variant="bodySm" color="textMuted" align="center" style={styles.subtitle}>
        Friday Night Freestyle · 42 min
      </Text>

      {/* Earnings */}
      <View style={styles.earned}>
        <Text style={styles.earnedValue}>+674</Text>
        <Text variant="label" color="green" style={styles.earnedUnit}>
          TK EARNED
        </Text>
      </View>

      {/* Stats — two flat columns, no cards */}
      <View style={styles.stats}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.stat}>
            <View style={styles.statTop}>
              <Feather name={s.icon} size={rf(13)} color={colors.textMuted} />
              <Text variant="bodySm" color="textMuted" numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            <Text variant="h1" style={styles.statValue}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      <SectionLabel divider style={styles.sectionLabel}>
        TOP SUPPORTERS
      </SectionLabel>

      {SUPPORTERS.map((s, i) => (
        <View key={s.initials} style={[styles.row, i === 0 ? null : styles.rowDivider]}>
          <Avatar initials={s.initials} name={s.name} size="md" color={s.color} />

          <View style={styles.rowText}>
            <Text variant="bodyLg" color="textPrimary">
              {s.name}
            </Text>
            <Text variant="bodySm" color="textMuted">
              {s.amount}
            </Text>
          </View>

          <View style={styles.tag}>
            <Feather name={s.tagIcon} size={rf(11)} color={s.tagTint} />
            <Text variant="label" color="textMuted">
              {s.tag}
            </Text>
          </View>
        </View>
      ))}

      {/* One container with an explicit `gap` owns the spacing between the
          three footer blocks. Per-element margins kept collapsing against one
          another; a gap on the parent cannot be. */}
      <View style={styles.footer}>
      <Pressable
        style={pressable(styles.nudge)}
        onPress={() => router.replace('/(app)/(tabs)/home/reward-fulfillment')}
        accessibilityRole="button"
        accessibilityLabel="Fulfil the 3 rewards waiting on delivery"
      >
        <View style={styles.nudgeRow}>
          <Feather name="alert-triangle" size={rf(16)} color={colors.gold} />
          <Text
            variant="bodySm"
            color="textSecondary"
            style={styles.nudgeText}
            numberOfLines={2}
          >
            <Text variant="bodySm" color="textPrimary" style={styles.strong}>
              3 rewards waiting
            </Text>{' '}
            — viewers want their shoutouts
          </Text>
          <Feather name="chevron-right" size={rf(15)} color={colors.textMuted} />
        </View>
      </Pressable>

      {/* Actions */}
      <Pressable
        style={pressable(styles.cta)}
        onPress={toDashboard}
        accessibilityRole="button"
        accessibilityLabel="Back to dashboard"
      >
        <LinearGradient
          colors={gradients.cta}
          start={gradientDirection.horizontal.start}
          end={gradientDirection.horizontal.end}
          style={styles.ctaFill}
        >
          <Text style={styles.ctaLabel}>Back to Dashboard</Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        style={pressable(styles.ghost)}
        onPress={() =>
          router.replace({
            pathname: '/(app)/(tabs)/home/broadcast-detail',
            params: { broadcastId: broadcastId ?? 'bc_live' },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="View full analytics"
      >
        {/* Centred on the Text itself — not inherited from the parent. */}
        <Text variant="bodyLg" color="pink" align="center" style={styles.strong}>
          View full analytics
        </Text>
      </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  closeRow: {
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 6,
  },

  earned: {
    alignItems: 'center',
    marginTop: 28,
  },
  earnedValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(46),
    lineHeight: rf(52),
    letterSpacing: -1,
    color: colors.pink,
  },
  earnedUnit: {
    letterSpacing: 1.8,
    marginTop: 2,
  },

  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 22,
    marginTop: 32,
  },
  stat: {
    width: '50%',
    alignItems: 'center',
    gap: 4,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: fontFamily.extrabold,
  },

  sectionLabel: {
    marginTop: 30,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  footer: {
    marginTop: 28,
    gap: 36,
  },
  nudge: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nudgeText: {
    flex: 1,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },

  cta: {
    // minHeight, not height — the bar can never be squeezed below the label.
    minHeight: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  // The radius is repeated on the gradient itself. `overflow: 'hidden'` on the
  // parent does not reliably clip a LinearGradient on Android, which is why
  // the bar was rendering with square corners.
  ctaFill: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ctaLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(15),
    color: colors.white,
  },
  ghost: {
    alignSelf: 'stretch',
    paddingVertical: 8,
  },
});

export default BroadcastSummaryScreen;
