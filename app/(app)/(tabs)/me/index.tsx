import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ConfirmDialog,
  EarningsBar,
  InsightLine,
  LoadFailed,
  RingAvatar,
  Screen,
  SectionLabel,
  Skeleton,
} from '@components/shared';
import { Text } from '@components/ui';
import { useFollowers } from '@hooks/useFollowers';
import { useBroadcastHistorySummary, useEarningsSummary } from '@hooks/useInsights';
import { useProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/authStore';
import { useNotificationStore } from '@store/notificationStore';
import { colors, fontFamily, layout, radius, typography } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { compactCount, formatTokens, grouped, initialsFrom, titleCase } from '@utils/format';
import { rf } from '@utils/responsive';

import type { ColorToken } from '@theme';

type FeatherIconName = keyof typeof Feather.glyphMap;

type Href =
  | '/(app)/(tabs)/me/edit-profile'
  | '/(app)/(tabs)/me/messages'
  | '/(app)/(tabs)/me/followers'
  | '/(app)/(tabs)/me/photos'
  | '/(app)/(tabs)/me/settings'
  | '/(app)/(tabs)/me/kyc-payouts'
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
    icon: 'user',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Profile',
    sub: 'Public details, rates & password',
    route: '/(app)/(tabs)/me/edit-profile',
  },
  {
    icon: 'users',
    tint: colors.violet,
    fill: colors.violetSoft,
    title: 'Followers',
    // Overridden at render with the real top-supporter count from useFollowers.
    sub: 'Top supporters',
    route: '/(app)/(tabs)/me/followers',
  },
  // Photos is hidden until the backend gives `/photos/upload-url` a unique
  // storage key per photo. Today it reuses one key per artist, so every
  // upload overwrites the last and the gallery shows the same picture on
  // every tile. The screen, its route and the whole data layer are intact —
  // restoring it is just putting this row back:
  //
  //   { icon: 'image', tint: colors.gold, fill: colors.goldSoft,
  //     title: 'Photos', sub: 'Your public gallery',
  //     route: '/(app)/(tabs)/me/photos' },
  {
    icon: 'settings',
    tint: colors.cyan,
    fill: colors.cyanSoft,
    title: 'Settings',
    sub: 'Reward menu & fun wheel',
    route: '/(app)/(tabs)/me/settings',
  },
  {
    icon: 'shield',
    tint: colors.gold,
    fill: colors.goldSoft,
    title: 'KYC & Payouts',
    sub: 'Required before withdrawal',
    route: '/(app)/(tabs)/me/kyc-payouts',
    // `pill` is set at render from the real kycStatus (REQUIRED/PENDING/…).
  },
];

const ACTIVITY: Row[] = [
  {
    icon: 'inbox',
    tint: colors.green,
    fill: colors.successChip,
    title: 'Transaction History',
    sub: 'Every coin in and out',
    route: '/(app)/(tabs)/business/transactions',
  },
];

interface Stat {
  value: string;
  label: string;
  color: ColorToken;
}

/** Me tab root — creator identity, headline numbers, and account navigation. */
const MeScreen = () => {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const hasUnread = useNotificationStore((s) => s.unreadCount > 0);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const { data: profile, isLoading, error: profileError } = useProfile();
  const { data: earnings, isLoading: loadingEarnings } = useEarningsSummary();
  const { data: followers } = useFollowers();
  const { data: bcSummary } = useBroadcastHistorySummary();

  const followerSummary = followers?.summary;
  const isApproved = profile?.approvalStatus === 'approved';

  // KYC pill tracks the real /profile/me kycStatus: approved hides the nudge,
  // pending/rejected show their state, anything else (empty/unknown) = REQUIRED.
  const kycPill = ((): string | undefined => {
    switch (profile?.kycStatus) {
      case 'approved':
        return undefined;
      case 'pending':
        return 'PENDING';
      case 'rejected':
        return 'REJECTED';
      default:
        return 'REQUIRED';
    }
  })();

  // Followers/Shows come from the same endpoints the web reads: /followers
  // (summary.totalFollowers) and /broadcast/history/summary (totalShows).
  // Earned is the wallet balance from /profile/me; Total is everything ever
  // earned, from /earnings/summary.
  const stats: Stat[] = [
    {
      value: followerSummary ? compactCount(followerSummary.totalFollowers) : '—',
      label: 'Followers',
      color: 'pink',
    },
    {
      value: profile ? formatTokens(profile.walletTokens) : '—',
      label: 'Earned',
      color: 'gold',
    },
    {
      value: earnings ? formatTokens(earnings.totalTokens) : '—',
      label: 'Total',
      color: 'green',
    },
    { value: bcSummary ? String(bcSummary.totalShows) : '—', label: 'Shows', color: 'cyan' },
  ];

  // The static ACCOUNT rows, with the Followers subtitle and KYC pill made
  // dynamic from the real summaries — same values the web shows.
  const accountRows: Row[] = ACCOUNT.map((row) => {
    if (row.title === 'Followers') {
      return { ...row, sub: `${followerSummary?.topSupporterCount ?? 0} top supporters` };
    }
    if (row.title === 'KYC & Payouts') {
      return { ...row, pill: kycPill };
    }
    return row;
  });

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
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={() => router.push('/(app)/(tabs)/home/notifications')}
          unread={hasUnread}
        />
      }
    >

      {/* Identity */}
      {isLoading ? (
        <View style={styles.identity}>
          <Skeleton width={96} height={96} round={48} />
          <Skeleton width={160} height={22} round={11} style={styles.handleSkeleton} />
          <Skeleton width={200} height={14} round={7} style={styles.subSkeleton} />
        </View>
      ) : profileError ? (
        // No retry button here by request. The message alone is the trade-off:
        // the rest of the screen still works, and pulling the tab again
        // refetches. Settings and Photos keep their retry.
        <LoadFailed message={getErrorMessage(profileError)} />
      ) : (
        <View style={styles.identity}>
          <RingAvatar
            initials={initialsFrom(profile?.stageName)}
            imageUrl={profile?.avatarUrl}
            // The badge means "cleared to go live", so it tracks approval.
            badge={isApproved ? 'READY' : undefined}
          />

          <Text variant="h2" style={styles.handle}>
            @{profile?.stageName ?? ''}
          </Text>
          <Text variant="bodySm" color={isApproved ? 'textMuted' : 'gold'}>
            {isApproved ? 'Verified creator' : titleCase(profile?.approvalStatus ?? 'Pending')}
            {profile?.categoryName ? ` · ${profile.categoryName}` : ''}
          </Text>

          {profile?.rejectedReason ? (
            <Text variant="bodySm" color="error" style={styles.rejected}>
              {profile.rejectedReason}
            </Text>
          ) : null}
        </View>
      )}

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            {isLoading || loadingEarnings ? (
              <Skeleton width={56} height={22} round={11} />
            ) : (
              <Text variant="h2" color={s.color} style={styles.statValue}>
                {s.value}
              </Text>
            )}
            <Text variant="bodySm" color="textMuted">
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <InsightLine
        style={styles.insight}
        lead={`${grouped(followerSummary?.newFollowersThisWeek ?? 0)} new followers this week`}
      />

      <SectionLabel style={styles.sectionLabel}>ACCOUNT</SectionLabel>
      {accountRows.map((row, i) => renderRow(row, i === accountRows.length - 1))}

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
    marginTop: 12,
  },
  handle: {
    marginTop: 24,
  },
  rejected: {
    marginTop: 6,
    textAlign: 'center',
  },
  handleSkeleton: {
    marginTop: 24,
  },
  subSkeleton: {
    marginTop: 10,
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
    marginTop: 12,
  },

  sectionLabel: {
    marginTop: 12,
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
    ...typography.badge,
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
