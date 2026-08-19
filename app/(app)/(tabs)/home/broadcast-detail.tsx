import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop, Line } from 'react-native-svg';

import { Header, ListRow, Screen } from '@components/shared';
import { Badge, Card, Text } from '@components/ui';
import { colors, gradients, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

const STATS = [
  { label: 'PEAK VIEWERS', value: '342' },
  { label: 'AVG WATCH TIME', value: '4m 12s' },
  { label: 'MESSAGES', value: '89' },
  { label: 'NEW FOLLOWERS', value: '12' },
];

const REVENUE = [
  { label: 'Highlighted messages', value: '60 tk', pct: 41, color: colors.primary },
  { label: 'Reactions', value: '40 tk', pct: 27, color: colors.success },
  { label: 'Fun wheel', value: '30 tk', pct: 20, color: colors.warning },
  { label: 'Rewards', value: '15 tk', pct: 12, color: colors.primaryDark },
];

/** Relative bar heights for the chat-activity histogram; peaks are highlighted. */
const CHAT = [20, 35, 25, 50, 80, 40, 60, 30, 90, 70, 45, 20, 30, 15];
const CHAT_PEAKS = [4, 8];

const ORDERS: {
  icon: IoniconName;
  tint: string;
  title: string;
  by: string;
  amount: string;
  status: string;
  tone: 'success' | 'warning';
}[] = [
  { icon: 'gift', tint: colors.primary, title: 'Custom Shoutout', by: 'by @neon_rider', amount: '15 tk', status: 'DELIVERED', tone: 'success' },
  { icon: 'musical-note', tint: colors.warning, title: 'Song Request', by: 'by @synth_wave99', amount: '10 tk', status: 'PENDING', tone: 'warning' },
  { icon: 'sparkles', tint: colors.success, title: 'Confetti Drop', by: 'by @pixel_punk', amount: '5 tk', status: 'DELIVERED', tone: 'success' },
];

/** Smoothed viewer-retention curve, drawn on a 0..100 x 0..40 viewBox. */
const RETENTION_LINE = 'M0,5 Q15,5 25,12 T50,22 T80,28 T100,32';
const RETENTION_AREA = `${RETENTION_LINE} L100,40 L0,40 Z`;

const BroadcastDetailScreen = () => {
  const router = useRouter();
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      <Header
        title="Broadcast Analytics"
        onBack={() => router.back()}
        rightIcon="share-outline"
        rightAccessibilityLabel="Share broadcast"
      />

      {/* Hero thumbnail */}
      <LinearGradient
        colors={gradients.cta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Ionicons name="musical-notes" size={rf(30)} color={colors.textPrimary} />
      </LinearGradient>

      <View style={styles.heading}>
        <Text variant="h3">Midnight Synth Session</Text>
        <Text variant="label" color="textMuted">
          Aug 17 · 12m · 1 viewer{broadcastId ? ` · ${broadcastId}` : ''}
        </Text>
      </View>

      {/* Earnings strip */}
      <Card style={styles.earnings}>
        <Text variant="label" color="textMuted" style={styles.earningsLabel}>
          TOTAL EARNED
        </Text>
        <View style={styles.earningsValue}>
          <Text variant="display" color="success" style={styles.earningsNumber}>
            +145
          </Text>
          <Text variant="h3" color="success">
            tk
          </Text>
        </View>
      </Card>

      {/* 2x2 stat grid */}
      <View style={styles.grid}>
        {STATS.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Text variant="label" color="textMuted">
              {s.label}
            </Text>
            <Text variant="h2" style={styles.statValue}>
              {s.value}
            </Text>
          </Card>
        ))}
      </View>

      {/* Viewer retention */}
      <Card style={styles.card}>
        <Text variant="h3">Viewer Retention</Text>
        <Svg width="100%" height={wp(28)} viewBox="0 0 100 40" preserveAspectRatio="none">
          <Defs>
            <SvgGradient id="retention" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          {[10, 20, 30].map((y) => (
            <Line key={y} x1="0" x2="100" y1={y} y2={y} stroke={colors.surfaceElevated} strokeWidth={0.5} />
          ))}
          <Path d={RETENTION_AREA} fill="url(#retention)" />
          <Path d={RETENTION_LINE} fill="none" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
        <View style={styles.axis}>
          {['0:00', '4:00', '8:00', '12:00'].map((t) => (
            <Text key={t} variant="label" color="textMuted">
              {t}
            </Text>
          ))}
        </View>
      </Card>

      {/* Revenue breakdown */}
      <Card style={styles.card}>
        <Text variant="h3">Revenue Breakdown</Text>
        <View style={styles.stackedBar}>
          {REVENUE.map((r) => (
            <View
              key={r.label}
              style={[styles.stackedSegment, { flex: r.pct, backgroundColor: r.color }]}
            />
          ))}
        </View>
        <View style={styles.legend}>
          {REVENUE.map((r) => (
            <View key={r.label} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text variant="caption" color="textSecondary">
                  {r.label}
                </Text>
              </View>
              <Text variant="label" color="textPrimary">
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Chat activity */}
      <Card style={styles.card}>
        <Text variant="h3">Chat Activity</Text>
        <View style={styles.chatChart}>
          {CHAT.map((h, i) => (
            <View
              key={i}
              style={[
                styles.chatBar,
                { height: `${h}%` },
                CHAT_PEAKS.includes(i) ? styles.chatBarPeak : null,
              ]}
            />
          ))}
        </View>
        <View style={styles.axis}>
          {['Start', 'Peak', 'End'].map((t) => (
            <Text key={t} variant="label" color="textMuted">
              {t}
            </Text>
          ))}
        </View>
      </Card>

      {/* Reward orders */}
      <Card style={styles.card}>
        <Text variant="h3">Reward Orders</Text>
        {ORDERS.map((o) => (
          <ListRow
            key={o.title}
            left={
              <View style={styles.orderIcon}>
                <Ionicons name={o.icon} size={rf(18)} color={o.tint} />
              </View>
            }
            title={o.title}
            subtitle={o.by}
            right={
              <View style={styles.orderMeta}>
                <Text variant="label" color="textPrimary">
                  {o.amount}
                </Text>
                <Badge label={o.status} tone={o.tone} />
              </View>
            }
            chevron={false}
          />
        ))}
      </Card>

      <Pressable style={styles.ghostBtn} accessibilityRole="button" accessibilityLabel="Download report">
        <Text variant="h3" color="primary">
          Download report
        </Text>
      </Pressable>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: spacing.xxs,
  },
  earnings: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  earningsLabel: {
    letterSpacing: 1.6,
  },
  earningsValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  earningsNumber: {
    fontSize: rf(34),
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
  statValue: {
    fontSize: rf(21),
  },
  card: {
    gap: spacing.md,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stackedBar: {
    flexDirection: 'row',
    gap: 2,
    height: wp(3),
  },
  stackedSegment: {
    borderRadius: radius.full,
  },
  legend: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: wp(3),
    height: wp(3),
    borderRadius: radius.full,
  },
  chatChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: wp(20),
    gap: wp(1),
  },
  chatBar: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  chatBarPeak: {
    backgroundColor: colors.primary,
  },
  orderIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  ghostBtn: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

export default BroadcastDetailScreen;
