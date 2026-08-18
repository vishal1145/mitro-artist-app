import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ListRow, Screen } from '@components/shared';
import { Avatar, Badge, Button, Card, LogoBadge, Text } from '@components/ui';
import { useAuthStore } from '@store';
import { colors, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;
type Href =
  | '/(app)/(tabs)/me/followers'
  | '/(app)/(tabs)/me/messages'
  | '/(app)/(tabs)/me/settings'
  | '/(app)/(tabs)/me/kyc-payouts'
  | '/(app)/(tabs)/business/transactions'
  | '/(app)/(tabs)/calls/broadcast-history'
  | '/(app)/(tabs)/home/reward-fulfillment'
  | '/(app)/(tabs)/home/notifications';

const STATS = [
  { label: 'Followers', value: '48.2K' },
  { label: 'Earned', value: '1.2k tk' },
  { label: 'Shows', value: '12' },
];

interface MenuItem {
  icon: IoniconName;
  label: string;
  route?: Href;
  badge?: string;
}

const MENU: { section: string; items: MenuItem[] }[] = [
  {
    section: 'ACCOUNT',
    items: [
      {
        icon: 'chatbubbles-outline',
        label: 'Messages',
        route: '/(app)/(tabs)/me/messages',
        badge: '2',
      },
      { icon: 'people-outline', label: 'Followers', route: '/(app)/(tabs)/me/followers' },
      { icon: 'settings-outline', label: 'Settings', route: '/(app)/(tabs)/me/settings' },
      {
        icon: 'shield-checkmark-outline',
        label: 'KYC & Payouts',
        route: '/(app)/(tabs)/me/kyc-payouts',
        badge: 'Required',
      },
    ],
  },
  {
    section: 'ACTIVITY',
    items: [
      {
        icon: 'gift-outline',
        label: 'Reward Deliveries',
        route: '/(app)/(tabs)/home/reward-fulfillment',
        badge: '3',
      },
      {
        icon: 'receipt-outline',
        label: 'Transaction History',
        route: '/(app)/(tabs)/business/transactions',
      },
      {
        icon: 'radio-outline',
        label: 'Broadcast History',
        route: '/(app)/(tabs)/calls/broadcast-history',
      },
      {
        icon: 'notifications-outline',
        label: 'Notifications',
        route: '/(app)/(tabs)/home/notifications',
      },
    ],
  },
];

const MeScreen = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  const name = user?.name ?? 'Creator';
  const username = user?.username ? `@${user.username}` : 'Signed in';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {/* App bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <LogoBadge variant="wave" size={wp(8)} />
          <Text variant="h3" style={styles.appBarTitle}>
            Me
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/me/settings')}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={rf(22)} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Profile header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileTop}>
          <Avatar initials={initials} name={name} size="lg" />
          <View style={styles.profileInfo}>
            <Text variant="h2" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" color="textMuted">
              {username}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={rf(13)} color={colors.warning} />
              <Text variant="caption" color="textSecondary">
                4.9 Creator Rating
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text variant="h3">{stat.value}</Text>
              <Text variant="caption" color="textMuted">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Menu */}
      {MENU.map((group) => (
        <View key={group.section} style={styles.group}>
          <Text variant="label" color="textMuted">
            {group.section}
          </Text>
          <Card style={styles.menuCard}>
            {group.items.map((item, i) => (
              <ListRow
                key={item.label}
                icon={item.icon}
                title={item.label}
                right={item.badge ? <Badge label={item.badge} tone="warning" /> : undefined}
                chevron
                divider={i > 0}
                onPress={item.route ? () => router.push(item.route as Href) : undefined}
                style={styles.menuRow}
              />
            ))}
          </Card>
        </View>
      ))}

      <Button label="Log out" variant="danger" leftIcon="log-out-outline" onPress={handleLogout} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appBarTitle: {
    fontSize: rf(17),
  },

  profileCard: {
    gap: spacing.lg,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },

  group: {
    gap: spacing.sm,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    paddingHorizontal: spacing.md,
  },
});

export default MeScreen;
