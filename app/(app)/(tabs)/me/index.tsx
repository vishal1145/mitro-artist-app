import { Feather } from '@expo/vector-icons';
import { StyleSheet, Pressable, View } from 'react-native';

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
import { MeRow } from '@screens/profile/me/components/MeRow';
import { ACTIVITY } from '@screens/profile/me/meRows';
import { useMeScreen } from '@screens/profile/me/useMeScreen';
import { colors, fontFamily, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { grouped, initialsFrom, titleCase } from '@utils/format';
import { rf } from '@utils/responsive';

/** Me tab root — creator identity, headline numbers, and account navigation. */
const MeScreen = () => {
  const {
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
    openLogoutConfirm,
    cancelLogoutConfirm,
    confirmLogout,
    navigateTo,
    goToNotifications,
  } = useMeScreen();

  return (
    <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}
      header={
        <EarningsBar
          brand
          onPressBell={goToNotifications}
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
      {accountRows.map((row, i) => (
        <MeRow
          key={row.title}
          row={row}
          last={i === accountRows.length - 1}
          onPress={() => navigateTo(row.route)}
        />
      ))}

      <SectionLabel style={styles.sectionLabel}>ACTIVITY</SectionLabel>
      {ACTIVITY.map((row, i) => (
        <MeRow
          key={row.title}
          row={row}
          last={i === ACTIVITY.length - 1}
          onPress={() => navigateTo(row.route)}
        />
      ))}

      <Pressable
        style={styles.logout}
        onPress={openLogoutConfirm}
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
        onConfirm={confirmLogout}
        onCancel={cancelLogoutConfirm}
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
