import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ConfirmDialog,
  EarningsBar,
  InsightLine,
  RingAvatar,
  Screen,
  SectionLabel,
} from '@components/shared';
import { Text } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

import type { ColorToken } from '@theme';

type FeatherIconName = keyof typeof Feather.glyphMap;

type Href =
  | '/(app)/(tabs)/me/messages'
  | '/(app)/(tabs)/me/followers'
  | '/(app)/(tabs)/me/settings'
  | '/(app)/(tabs)/me/kyc-payouts'
  | '/(app)/(tabs)/home/reward-fulfillment'
  | '/(app)/(tabs)/business/transactions';

interface Row {
  icon: FeatherIconName;
  tint: string;
  fill: string;
  title: string;
  sub: string;
  route: Href;
  /** Pink count bubble. */
  badge?: number;
  /** Gold status pill, e.g. REQUIRED. */
  pill?: string;
}

const ACCOUNT: Row[] = [
  {
    icon: 'message-circle',
    tint: colors.pink,
    fill: colors.pinkSoft,
    title: 'Messages',
    sub: 'Riya sent 250 coins',
    route: '/(app)/(tabs)/me/messages',
    badge: 2,
  },
  {
    icon: 'users',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Followers',
    sub: '128 top supporters',
    route: '/(app)/(tabs)/me/followers',
  },
  {
    icon: 'settings',
    tint: colors.cyan,
    fill: colors.cyanSoft,
    title: 'Settings',
    sub: 'Profile, reward menu, fun wheel',
    route: '/(app)/(tabs)/me/settings',
  },
  {
    icon: 'shield',
    tint: colors.gold,
    fill: colors.goldSoft,
    title: 'KYC & Payouts',
    sub: 'Required before withdrawal',
    route: '/(app)/(tabs)/me/kyc-payouts',
    pill: 'REQUIRED',
  },
];

const ACTIVITY: Row[] = [
  {
    icon: 'gift',
    tint: colors.pink,
    fill: colors.pinkSoft,
    title: 'Reward Deliveries',
    sub: '3 waiting on delivery',
    route: '/(app)/(tabs)/home/reward-fulfillment',
    badge: 3,
  },
  {
    icon: 'inbox',
    tint: colors.green,
    fill: colors.successChip,
    title: 'Transaction History',
    sub: 'Every token in and out',
    route: '/(app)/(tabs)/business/transactions',
  },
];

const STATS: { value: string; label: string; color: ColorToken }[] = [
  { value: '48.2K', label: 'Followers', color: 'pink' },
  { value: '1.2k tk', label: 'Earned', color: 'gold' },
  { value: '12', label: 'Shows', color: 'cyan' },
];

/** Me tab root — creator identity, headline numbers, and account navigation. */
const MeScreen = () => {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleLogout = () => {
    setConfirmingLogout(false);
    void logout().then(() => router.replace('/(auth)/login'));
  };

  const renderRow = (row: Row, last: boolean) => (
    <Pressable
      key={row.title}
      style={[styles.row, last ? null : styles.rowDivider]}
      onPress={() => router.push(row.route)}
      accessibilityRole="button"
      accessibilityLabel={row.title}
      accessibilityHint={row.sub}
    >
      <View style={[styles.rowIcon, { backgroundColor: row.fill }]}>
        <Feather name={row.icon} size={rf(17)} color={row.tint} />
      </View>

      <View style={styles.rowText}>
        <Text variant="bodyLg" color="textPrimary" style={styles.rowTitle}>
          {row.title}
        </Text>
        <Text variant="bodySm" color="textMuted" numberOfLines={1}>
          {row.sub}
        </Text>
      </View>

      {row.pill ? (
        <View style={styles.pill}>
          <Text variant="label" color="gold">
            {row.pill}
          </Text>
        </View>
      ) : null}

      {row.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{row.badge}</Text>
        </View>
      ) : null}

      <Feather name="chevron-right" size={rf(16)} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}>
      <EarningsBar
        brand
        onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
        unread
      />

      {/* Identity */}
      <View style={styles.identity}>
        <RingAvatar initials="Y7" badge="READY" />

        <Text variant="h2" style={styles.handle}>
          @yash_7247
        </Text>
        <Text variant="bodySm" color="textMuted">
          Verified creator · Music &amp; Talk
        </Text>

        <View style={styles.rating}>
          <Feather name="star" size={rf(12)} color={colors.gold} />
          <Feather name="star" size={rf(12)} color={colors.gold} />
          <Feather name="star" size={rf(12)} color={colors.gold} />
          <Feather name="star" size={rf(12)} color={colors.gold} />
          <Feather name="star" size={rf(12)} color={colors.gold} />
          <Text variant="bodySm" color="textPrimary" style={styles.ratingText}>
            4.9 creator rating
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text variant="h2" color={s.color} style={styles.statValue}>
              {s.value}
            </Text>
            <Text variant="bodySm" color="textMuted">
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <InsightLine style={styles.insight} lead="940 new followers this week" />

      <SectionLabel style={styles.sectionLabel}>ACCOUNT</SectionLabel>
      {ACCOUNT.map((row, i) => renderRow(row, i === ACCOUNT.length - 1))}

      <SectionLabel style={styles.sectionLabel}>ACTIVITY</SectionLabel>
      {ACTIVITY.map((row, i) => renderRow(row, i === ACTIVITY.length - 1))}

      <Pressable
        style={styles.logout}
        onPress={() => setConfirmingLogout(true)}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Feather name="log-out" size={rf(17)} color={colors.red} />
        <Text variant="bodyLg" color="red" style={styles.logoutLabel}>
          Log out
        </Text>
      </Pressable>

      <ConfirmDialog
        visible={confirmingLogout}
        icon="log-out"
        title="Log out?"
        message="You'll need to sign in again to go live."
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  identity: {
    alignItems: 'center',
    marginTop: 28,
  },
  handle: {
    marginTop: 24,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 10,
  },
  ratingText: {
    fontFamily: fontFamily.bold,
    marginLeft: 6,
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
  statValue: {
    fontFamily: fontFamily.extrabold,
  },

  insight: {
    marginTop: 22,
  },

  sectionLabel: {
    marginTop: 26,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fontFamily.bold,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    color: colors.white,
  },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.pill,
    paddingVertical: 16,
    marginTop: 28,
  },
  logoutLabel: {
    fontFamily: fontFamily.bold,
  },
});

export default MeScreen;
