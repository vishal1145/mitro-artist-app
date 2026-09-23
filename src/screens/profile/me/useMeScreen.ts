import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useFollowers } from '@hooks/useFollowers';
import { useBroadcastHistorySummary, useEarningsSummary } from '@hooks/useInsights';
import { useProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/authStore';
import { useNotificationStore } from '@store/notificationStore';
import { compactCount, formatTokens } from '@utils/format';

import { ACCOUNT } from './meRows';
import type { Href, Row, Stat } from './types';

import type { FollowersResponse } from '@app-types/api';

export interface UseMeScreenResult {
  hasUnread: boolean;
  profile: ReturnType<typeof useProfile>['data'];
  isLoading: boolean;
  profileError: ReturnType<typeof useProfile>['error'];
  loadingEarnings: boolean;
  isApproved: boolean;
  followerSummary: FollowersResponse['summary'] | undefined;
  stats: Stat[];
  accountRows: Row[];
  confirmingLogout: boolean;
  openLogoutConfirm: () => void;
  cancelLogoutConfirm: () => void;
  confirmLogout: () => void;
  navigateTo: (route: Href) => void;
  goToNotifications: () => void;
}

/** Me tab logic: identity/stats derivation, account row wiring, and logout. */
export const useMeScreen = (): UseMeScreenResult => {
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

  const confirmLogout = () => {
    setConfirmingLogout(false);
    void logout().then(() => router.replace('/(auth)/login'));
  };

  return {
    hasUnread,
    profile,
    isLoading,
    profileError,
    loadingEarnings,
    isApproved,
    followerSummary,
    stats,
    accountRows,
    confirmingLogout,
    openLogoutConfirm: () => setConfirmingLogout(true),
    cancelLogoutConfirm: () => setConfirmingLogout(false),
    confirmLogout,
    navigateTo: (route: Href) => router.push(route),
    goToNotifications: () => router.push('/(app)/(tabs)/home/notifications'),
  };
};
