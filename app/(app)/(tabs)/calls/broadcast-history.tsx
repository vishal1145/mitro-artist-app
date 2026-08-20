import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  InsightLine,
  PageHeader,
  Screen,
  SectionLabel,
  TimelineRow,
} from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, layout } from '@theme';
import { rf } from '@utils/responsive';

import type { ColorToken } from '@theme';

interface Broadcast {
  id: string;
  title: string;
  meta: string;
  earned: string;
  dot: string;
  /** Amount tint tracks the dot: green earned well, gold means it ran short. */
  earnedColor: ColorToken;
}

const PAST: Broadcast[] = [
  {
    id: 'bc_001',
    title: 'Midnight Synth Session',
    meta: 'Aug 17 · 12m · 342 viewers',
    earned: '+145 tk',
    dot: colors.green,
    earnedColor: 'green',
  },
  {
    id: 'bc_002',
    title: 'Acoustic Chill Session',
    meta: 'Aug 14 · 1h 20m · 890 viewers',
    earned: '+85 tk',
    dot: colors.gold,
    earnedColor: 'gold',
  },
  {
    id: 'bc_003',
    title: 'Weekly Q&A #12',
    meta: 'Aug 10 · 30m · 2.1K viewers',
    earned: '+320 tk',
    dot: colors.green,
    earnedColor: 'green',
  },
];

/** Solo broadcast history — lifetime earnings, reward queue, and past shows. */
const BroadcastHistoryScreen = () => {
  const router = useRouter();

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <PageHeader title="Broadcasts" onBack={() => router.back()} />
      }
    >

      {/* Lifetime total */}
      <View style={styles.hero}>
        <Text style={styles.heroValue}>1.2k</Text>
        <Text variant="bodyLg" color="textMuted">
          tk
        </Text>
      </View>

      <Text variant="bodySm" color="textSecondary" align="center" style={styles.heroCaption}>
        earned across{' '}
        <Text variant="bodySm" color="pink" style={styles.strong}>
          12 shows
        </Text>
      </Text>
      <Text variant="bodySm" color="textMuted" align="center" style={styles.heroSub}>
        845 unique viewers · 45m avg length
      </Text>

      <InsightLine
        style={styles.insight}
        lead="Deliver rewards fast to keep tips coming"
        onHelp={() => router.push('/(app)/(tabs)/home/reward-fulfillment')}
      />

      <SectionLabel divider style={styles.sectionLabel}>
        PENDING REWARD DELIVERIES
      </SectionLabel>

      <View style={styles.empty}>
        <Feather name="mail" size={rf(40)} color={colors.textMuted} />
        <Text variant="bodyLg" color="textSecondary" align="center" style={styles.emptyTitle}>
          Nothing waiting
        </Text>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/home/reward-fulfillment')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="View all rewards"
        >
          <Text variant="bodyLg" color="pink" style={styles.strong}>
            View all rewards
          </Text>
        </Pressable>
      </View>

      <SectionLabel divider style={styles.sectionLabel}>
        PAST BROADCASTS
      </SectionLabel>

      {PAST.map((b, i) => (
        <TimelineRow
          key={b.id}
          title={b.title}
          meta={b.meta}
          value={b.earned}
          valueColor={b.earnedColor}
          dotColor={b.dot}
          last={i === PAST.length - 1}
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/home/broadcast-detail',
              params: { broadcastId: b.id },
            })
          }
        />
      ))}

      {/* Explains what the dot colours mean, so they aren't just decoration. */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendGreen]} />
          <Text variant="bodySm" color="textMuted">
            Earned well
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendGold]} />
          <Text variant="bodySm" color="textMuted">
            Ran short
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  heroValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(28),
    lineHeight: rf(33),
    color: colors.gold,
  },
  heroCaption: {
    marginTop: 4,
  },
  heroSub: {
    marginTop: 2,
  },
  strong: {
    fontFamily: fontFamily.bold,
  },
  insight: {
    marginTop: 16,
  },

  sectionLabel: {
    marginTop: 12,
    marginBottom: 16,
  },

  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  emptyTitle: {
    marginTop: 2,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendGreen: {
    backgroundColor: colors.green,
  },
  legendGold: {
    backgroundColor: colors.gold,
  },
});

export default BroadcastHistoryScreen;
