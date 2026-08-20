import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Header, Screen, SegmentedControl } from '@components/shared';
import { Avatar, Card, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;
type RewardStatus = 'pending' | 'delivered';

interface Reward {
  id: string;
  icon: FeatherIconName;
  tint: string;
  tintBg: string;
  title: string;
  due: string;
  /** Highlight the due copy when it's close. */
  urgent?: boolean;
  amount: string;
  fan: string;
  fanInitials: string;
  source: string;
  request?: string;
  status: RewardStatus;
  deliveredAgo?: string;
}

const REWARDS: Reward[] = [
  {
    id: 'r1',
    icon: 'music',
    tint: colors.primary,
    tintBg: colors.primarySoft,
    title: 'Song Request',
    due: 'Due in 6h',
    urgent: true,
    amount: '30 tk',
    fan: 'AlexTheGreat',
    fanInitials: 'AG',
    source: 'from Group Call · Aug 17',
    request: "Hey! Can you sing 'Midnight City' on your next stream? It's my favorite!",
    status: 'pending',
  },
  {
    id: 'r2',
    icon: 'mic',
    tint: colors.success,
    tintBg: colors.successChip,
    title: 'Custom Shoutout',
    due: 'Due in 2 days',
    amount: '15 tk',
    fan: 'Sarah_G',
    fanInitials: 'SG',
    source: 'from Live Stream · Aug 16',
    request: 'Happy birthday to my best friend Mark! Please give him a shoutout.',
    status: 'pending',
  },
  {
    id: 'r3',
    icon: 'video',
    tint: colors.textMuted,
    tintBg: colors.iconChip,
    title: '1:1 Video Call',
    due: '',
    amount: '100 tk',
    fan: 'JBaller99',
    fanInitials: 'JB',
    source: 'from Profile · Aug 15',
    status: 'delivered',
    deliveredAgo: 'Delivered 4h ago',
  },
];

const SUMMARY = [
  { label: 'PENDING', value: '3', tone: 'textPrimary' as const },
  { label: 'DUE TODAY', value: '1', tone: 'warning' as const },
  { label: 'AVG DELIVERY', value: '4h', tone: 'textPrimary' as const },
];

const RewardFulfillmentScreen = () => {
  const router = useRouter();
  const { filter: initialFilter } = useLocalSearchParams<{ filter?: string }>();
  const [tab, setTab] = useState<string>(initialFilter ?? 'To Fulfil (3)');
  const [delivered, setDelivered] = useState<string[]>([]);

  const rows = useMemo(() => {
    if (tab.startsWith('Delivered')) {
      return REWARDS.filter((r) => r.status === 'delivered' || delivered.includes(r.id));
    }
    if (tab === 'Expired') {
      return [];
    }
    return REWARDS.filter((r) => r.status === 'pending' && !delivered.includes(r.id));
  }, [tab, delivered]);

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      <Header title="Reward Deliveries" onBack={() => router.back()} />

      {/* Urgency banner */}
      <View style={styles.banner}>
        <Feather name="alert-triangle" size={rf(17)} color={colors.warning} />
        <Text variant="caption" color="textSecondary" style={styles.bannerText}>
          Fulfil rewards promptly — fans notice when a shoutout or song request never arrives, and that erodes trust.
        </Text>
      </View>

      <SegmentedControl
        options={['To Fulfil (3)', 'Delivered', 'Expired']}
        value={tab}
        onChange={setTab}
        variant="inset"
      />

      {/* Summary strip */}
      <Card style={styles.summary}>
        {SUMMARY.map((s, i) => (
          <View key={s.label} style={styles.summaryCell}>
            {i > 0 ? <View style={styles.summaryDivider} /> : null}
            <Text variant="label" color="textMuted" align="center">
              {s.label}
            </Text>
            <Text variant="h3" color={s.tone} align="center" style={styles.summaryValue}>
              {s.value}
            </Text>
          </View>
        ))}
      </Card>

      {/* Reward cards */}
      {rows.map((r) => {
        const isDone = r.status === 'delivered' || delivered.includes(r.id);

        return (
          <Card key={r.id} style={[styles.reward, isDone ? styles.rewardDone : null]}>
            <View style={styles.rewardHead}>
              <View style={[styles.rewardIcon, { backgroundColor: r.tintBg }]}>
                <Feather name={r.icon} size={rf(18)} color={r.tint} />
              </View>
              <View style={styles.rewardHeadText}>
                <Text
                  variant="link"
                  color={isDone ? 'textSecondary' : 'textPrimary'}
                  style={isDone ? styles.struck : undefined}
                >
                  {r.title}
                </Text>
                {isDone ? (
                  <View style={styles.deliveredLine}>
                    <Feather name="check" size={rf(12)} color={colors.success} />
                    <Text variant="label" color="success">
                      {r.deliveredAgo ?? 'Delivered just now'}
                    </Text>
                  </View>
                ) : (
                  <Text variant="label" color={r.urgent ? 'warning' : 'textMuted'}>
                    {r.due}
                  </Text>
                )}
              </View>
              <Text variant="link" color={isDone ? 'textMuted' : 'warning'}>
                {r.amount}
              </Text>
            </View>

            {/* Fan */}
            <View style={styles.fanRow}>
              <Avatar initials={r.fanInitials} name={r.fan} size="sm" />
              <View style={styles.fanText}>
                <Text variant="caption" color={isDone ? 'textSecondary' : 'textPrimary'}>
                  {r.fan}
                </Text>
                <Text variant="caption" color="textMuted" style={styles.fanSource}>
                  {r.source}
                </Text>
              </View>
            </View>

            {/* Request quote */}
            {r.request && !isDone ? (
              <View style={styles.quote}>
                <View style={styles.quoteBar} />
                <Text variant="caption" color="textSecondary" style={styles.quoteText}>
                  &quot;{r.request}&quot;
                </Text>
              </View>
            ) : null}

            {/* Actions */}
            {!isDone ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.actionGhost]}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/(modals)/chat-thread',
                      params: { followerId: r.id, name: r.fan },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${r.fan}`}
                >
                  <Feather name="message-circle" size={rf(15)} color={colors.textPrimary} />
                  <Text variant="caption" color="textPrimary">
                    Message
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionBtn, styles.actionPrimary]}
                  onPress={() => setDelivered((prev) => [...prev, r.id])}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${r.title} delivered`}
                >
                  <Feather name="check-circle" size={rf(15)} color={colors.onSuccess} />
                  <Text variant="caption" color="onSuccess" style={styles.actionPrimaryText}>
                    Mark delivered
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        );
      })}

      {rows.length === 0 ? (
        <Text variant="caption" color="textMuted" align="center" style={styles.empty}>
          Nothing in “{tab}” right now.
        </Text>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: wp(1),
    borderLeftColor: colors.warning,
    padding: spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  summaryDivider: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
  },
  summaryValue: {
    marginTop: spacing.xxs,
  },

  reward: {
    gap: spacing.md,
  },
  rewardDone: {
    opacity: 0.7,
  },
  rewardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rewardIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardHeadText: {
    flex: 1,
    gap: spacing.xxs,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  deliveredLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  fanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fanText: {
    gap: spacing.xxs,
  },
  fanSource: {
    fontSize: rf(10),
  },
  quote: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  quoteBar: {
    width: wp(1),
    backgroundColor: colors.primary,
  },
  quoteText: {
    flex: 1,
    fontStyle: 'italic',
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  actionGhost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionPrimary: {
    backgroundColor: colors.success,
  },
  actionPrimaryText: {
    fontFamily: fontFamily.bodySemibold,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
});

export default RewardFulfillmentScreen;
