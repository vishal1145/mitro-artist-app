import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Header, Screen, SegmentedControl } from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;
type Tone = 'primary' | 'success' | 'warning';

interface Notification {
  id: string;
  icon: IoniconName;
  tone: Tone;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  category: string;
}

const FILTERS = ['All', 'Earnings', 'Followers', 'System'] as const;

const GROUPS: { label: string; items: Notification[] }[] = [
  {
    label: 'Today',
    items: [
      {
        id: 'n1',
        icon: 'eye',
        tone: 'primary',
        title: 'Your stream crossed 2K viewers',
        body: 'Acoustic Request Night is trending in Music',
        time: 'New',
        unread: true,
        category: 'System',
      },
      {
        id: 'n2',
        icon: 'wallet',
        tone: 'success',
        title: 'Payout ready',
        body: 'Rs 18,450 is available to withdraw',
        time: '1h',
        unread: true,
        category: 'Earnings',
      },
    ],
  },
  {
    label: 'This Week',
    items: [
      {
        id: 'n3',
        icon: 'calendar',
        tone: 'warning',
        title: 'Session reminder',
        body: 'Creator Q&A starts tomorrow at 7:00 PM',
        time: '1d',
        category: 'System',
      },
      {
        id: 'n4',
        icon: 'bulb',
        tone: 'warning',
        title: 'Profile tip',
        body: 'Add a pinned intro video to improve conversion',
        time: '2d',
        category: 'System',
      },
      {
        id: 'n5',
        icon: 'sparkles',
        tone: 'primary',
        title: 'New follower milestone',
        body: 'You just crossed 48K followers overall',
        time: '3d',
        category: 'Followers',
      },
    ],
  },
  {
    label: 'Earlier',
    items: [
      {
        id: 'n6',
        icon: 'checkmark-circle',
        tone: 'success',
        title: 'Last payout completed',
        body: 'Rs 9,200 was sent to your bank account',
        time: '5d',
        category: 'Earnings',
      },
    ],
  },
];

const TONE_BG: Record<Tone, string> = {
  primary: colors.primaryChip,
  success: colors.successChip,
  warning: colors.warningChip,
};

const TONE_FG: Record<Tone, string> = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
};

/** Single notification row: tinted icon chip, title + time, body, unread dot. */
const NotificationRow = ({ item, read }: { item: Notification; read: boolean }) => (
  <Pressable
    style={[styles.row, item.unread && !read ? styles.rowUnread : null]}
    accessibilityRole="button"
    accessibilityLabel={item.title}
  >
    <View style={[styles.rowIcon, { backgroundColor: TONE_BG[item.tone] }]}>
      <Ionicons name={item.icon} size={rf(18)} color={TONE_FG[item.tone]} />
    </View>

    <View style={styles.rowBody}>
      <View style={styles.rowTitleLine}>
        <Text variant="link" color="textPrimary" numberOfLines={1} style={styles.rowTitle}>
          {item.title}
        </Text>
        <Text variant="label" color="textMuted">
          {item.time}
        </Text>
      </View>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {item.body}
      </Text>
    </View>

    {item.unread && !read ? <View style={styles.unreadDot} /> : null}
  </Pressable>
);

const NotificationsScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');
  const [allRead, setAllRead] = useState(false);

  const groups = GROUPS.map((g) => ({
    ...g,
    items: filter === 'All' ? g.items : g.items.filter((i) => i.category === filter),
  })).filter((g) => g.items.length > 0);

  return (
    <Screen scrollable padded={false} contentContainerStyle={styles.content}>
      <View style={styles.padded}>
        <Header title="Notifications" onBack={() => router.back()} />
      </View>

      <View style={[styles.padded, styles.topActions]}>
        <Pressable
          onPress={() => setAllRead(true)}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel="Mark all read"
        >
          <Text variant="label" color="primary">
            Mark all read
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </ScrollView>

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <Text variant="label" color="textMuted" style={styles.groupLabel}>
            {group.label}
          </Text>
          {group.items.map((item) => (
            <NotificationRow key={item.id} item={item} read={allRead} />
          ))}
        </View>
      ))}

      {groups.length === 0 ? (
        <Text variant="caption" color="textMuted" align="center" style={styles.empty}>
          Nothing here under “{filter}”.
        </Text>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  topActions: {
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  // A horizontal ScrollView nested in the screen's vertical one will stretch to
  // absorb leftover space; flexGrow 0 pins it to its content height.
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filters: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  group: {
    marginTop: spacing.sm,
  },
  groupLabel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: 1,
  },
  rowUnread: {
    backgroundColor: colors.surface,
  },
  rowIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fontFamily.headingSemibold,
  },
  unreadDot: {
    width: wp(2),
    height: wp(2),
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
});

export default NotificationsScreen;
