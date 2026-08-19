import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CircleFilters,
  InsightLine,
  PageHeader,
  Screen,
  SectionLabel,
  type CircleFilterOption,
} from '@components/shared';
import { Avatar, Text } from '@components/ui';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

import type { ColorToken } from '@theme';

type Filter = 'all' | 'top' | 'regulars' | 'new';

interface Follower {
  id: string;
  name: string;
  initials: string;
  color: string;
  /** Tag pill under the name. Omitted for plain followers. */
  tag?: { label: string; tint: ColorToken; fill: string; border: string };
  /** Fallback caption when there's no tag. */
  role: string;
  coins: string;
  buckets: Filter[];
}

const FOLLOWERS: Follower[] = [
  {
    id: 'f_riya',
    name: 'Riya Sharma',
    initials: 'R',
    color: colors.pink,
    tag: {
      label: 'TOP SUPPORTER',
      tint: 'green',
      fill: colors.successChip,
      border: colors.successBorder,
    },
    role: '12 sessions',
    coins: '12,450',
    buckets: ['all', 'top', 'regulars'],
  },
  {
    id: 'f_kabir',
    name: 'Kabir Mehta',
    initials: 'K',
    color: colors.violet,
    tag: {
      label: 'JOINED 8 SESSIONS',
      tint: 'violet',
      fill: colors.violetSoft,
      border: colors.violetSoft,
    },
    role: '8 sessions',
    coins: '8,750',
    buckets: ['all', 'top', 'regulars'],
  },
  {
    id: 'f_ananya',
    name: 'Ananya Rao',
    initials: 'A',
    color: colors.cyan,
    tag: {
      label: 'NEW FOLLOWER',
      tint: 'pink',
      fill: colors.pinkSoft,
      border: colors.borderHot,
    },
    role: 'Joined this week',
    coins: '1,200',
    buckets: ['all', 'new'],
  },
  {
    id: 'f_dev',
    name: 'Dev P.',
    initials: 'D',
    color: colors.gold,
    role: 'Follower',
    coins: '950',
    buckets: ['all'],
  },
  {
    id: 'f_meera',
    name: 'Meera K.',
    initials: 'M',
    color: colors.green,
    role: 'Follower',
    coins: '720',
    buckets: ['all'],
  },
];

const FILTERS: CircleFilterOption[] = [
  { value: 'all', label: 'All', icon: 'people' },
  { value: 'top', label: 'Top', icon: 'trending-up-outline' },
  { value: 'regulars', label: 'Regulars', icon: 'repeat-outline' },
  { value: 'new', label: 'New', icon: 'sparkles-outline' },
];

const STATS: { value: string; label: string; color: ColorToken; star?: boolean }[] = [
  { value: '128', label: 'Top Supporters', color: 'green' },
  { value: '12', label: 'Session Regulars', color: 'violet' },
  { value: '4.9', label: 'Creator Rating', color: 'gold', star: true },
];

/** Rank colours: gold, silver, bronze, then muted. */
const rankColor = (rank: number): ColorToken =>
  rank === 1 ? 'gold' : rank === 2 ? 'textSecondary' : rank === 3 ? 'red' : 'textMuted';

const FollowersScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => FOLLOWERS.filter((f) => f.buckets.includes(filter)), [filter]);

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}>
      <PageHeader
        title="Followers"
        onBack={() => router.back()}
        right={
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/(app)/(tabs)/me/messages')}
            accessibilityRole="button"
            accessibilityLabel="Open messages"
          >
            <Ionicons name="chatbubble-outline" size={rf(17)} color={colors.textPrimary} />
          </Pressable>
        }
      />

      {/* Headline count */}
      <Text style={styles.heroValue}>48.2K</Text>
      <Text variant="label" color="textMuted" align="center">
        FOLLOWERS
      </Text>

      <InsightLine
        style={styles.insight}
        lead="940 new this week"
        tail=" driven by live gifts and paid sessions."
      />

      <View style={styles.stats}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.stat}>
            <View style={styles.statValueRow}>
              <Text variant="h3" color={s.color} style={styles.statValue}>
                {s.value}
              </Text>
              {s.star ? <Ionicons name="star" size={rf(12)} color={colors.gold} /> : null}
            </View>
            <Text variant="bodySm" color="textMuted">
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <CircleFilters
        style={styles.filters}
        options={FILTERS}
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
      />

      <SectionLabel style={styles.sectionLabel} onHelp={() => undefined}>
        LEADERBOARD
      </SectionLabel>

      {rows.map((f, i) => (
        <View key={f.id} style={[styles.row, i === 0 ? null : styles.rowDivider]}>
          <Text variant="bodyLg" color={rankColor(i + 1)} style={styles.rank}>
            {i + 1}
          </Text>

          <Avatar initials={f.initials} name={f.name} size="md" color={f.color} />

          <View style={styles.rowText}>
            <Text variant="bodyLg" color="textPrimary" style={styles.name} numberOfLines={1}>
              {f.name}
            </Text>

            {f.tag ? (
              <View
                style={[styles.tag, { backgroundColor: f.tag.fill, borderColor: f.tag.border }]}
              >
                <Text variant="label" color={f.tag.tint}>
                  {f.tag.label}
                </Text>
              </View>
            ) : null}

            {/* Own row — sitting beside the pill pushed it under the coins column. */}
            <Text variant="bodySm" color="textMuted" numberOfLines={1}>
              {f.role}
            </Text>
          </View>

          <View style={styles.coins}>
            <Text variant="bodySm" color="gold" style={styles.coinsValue}>
              {f.coins}
            </Text>
            <Text variant="label" color="textMuted">
              COINS
            </Text>
          </View>

          <Pressable
            style={styles.chatBtn}
            onPress={() =>
              router.push({
                pathname: '/(app)/(modals)/chat-thread',
                params: { followerId: f.id, name: f.name },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Message ${f.name}`}
          >
            <Ionicons name="chatbubble-outline" size={rf(15)} color={colors.textSecondary} />
          </Pressable>
        </View>
      ))}

      <Text variant="bodySm" color="textMuted" align="center" style={styles.footnote}>
        Message with care — a personal note beats a promo blast; spammy DMs get unfollows.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroValue: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(40),
    lineHeight: rf(48),
    color: colors.pink,
    textAlign: 'center',
    marginTop: 22,
  },
  insight: {
    marginTop: 18,
  },

  stats: {
    flexDirection: 'row',
    marginTop: 22,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontFamily: fontFamily.extrabold,
  },

  filters: {
    marginTop: 24,
  },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rank: {
    width: 18,
    fontFamily: fontFamily.extrabold,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: fontFamily.bold,
  },
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  coins: {
    alignItems: 'flex-end',
  },
  coinsValue: {
    fontFamily: fontFamily.extrabold,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footnote: {
    marginTop: 26,
    lineHeight: rf(19),
  },
});

export default FollowersScreen;
