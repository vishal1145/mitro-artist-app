import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { CalloutStrong, CalloutText, LearnLink, WebCallout } from '@components/history';
import { Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { gradientDirection, palette, webColors, webGradients } from '@theme';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

import { ActivityRow } from '@screens/settings/settings/components/ActivityRow';
import { DeleteWheelConflictModal } from '@screens/settings/settings/components/DeleteWheelConflictModal';
import { RewardTableRow } from '@screens/settings/settings/components/RewardTableRow';
import { WheelVisual } from '@screens/settings/settings/components/WheelVisual';
import { sanitizeDigits } from '@screens/settings/settings/schema';
import { styles } from '@screens/settings/settings/styles';
import { useSettings } from '@screens/settings/settings/useSettings';

/**
 * Settings — a replica of the Artist Web's `.creator-settings-page` at mobile
 * widths (main.tsx:1733–1800, `RewardMenuSettingsUI` 8021–8139,
 * `FunWheelSettingsUI` 8142–8479; styles.css `.creator-settings-page` block).
 *
 * `.grid-2` collapses to one column at `@media (max-width: 920px)`, so the two
 * cards stack on a phone. Page gutter is 12px, per the `@media (max-width:
 * 768px) { .creator-main { padding: 12px !important } }` rule.
 */
const SettingsScreen = () => {
  const router = useRouter();

  const {
    rewards,
    loadingRewards,
    rewardRows,
    savingRewards,
    seedRewardRows,
    addRewardRow,
    removeRewardRow,
    updateRewardRow,
    saveRewards,

    wheel,
    loadingWheel,
    slices,
    addSlice,
    removeSlice,
    updateSliceName,
    updateSliceWeight,
    totalWeight,

    wheelName,
    setWheelName,
    wheelPrice,
    setWheelPrice,
    wheelOn,
    savingWheel,
    saveWheel,
    toggleWheel,

    deleteConflict,
    closeDeleteConflict,
    deleteWheel,
    turnOffInstead,
  } = useSettings();

  return (
    <View style={styles.root}>
      <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}>
        {/* .page-head — back circle + title block, gap 12 */}
        <View style={styles.pageHead}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <LucideIcon name="arrow-left" size={rf(18)} color={webColors.textStrong} />
          </Pressable>
          <View style={styles.headText}>
            <Text style={styles.h1}>Settings</Text>
            <Text style={styles.headSub}>
              Manage your account preferences, rewards, and tip menus.
            </Text>
          </View>
        </View>

        {/* .tab-bar — pill rail, 4px padding, gap 4 */}
        <View style={styles.tabBar}>
          <View style={styles.tabBtnActive}>
            <LinearGradient
              colors={webGradients.activePill}
              start={gradientDirection.diagonal.start}
              end={gradientDirection.diagonal.end}
              style={StyleSheet.absoluteFill}
            />
            <LucideIcon name="gift" size={rf(14)} color={palette.white} />
            <Text style={styles.tabLabelActive}>Rewards &amp; Fun Wheel</Text>
          </View>
        </View>

        {/* ── Section: Reward Menu Settings ──────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.cardH3}>
            <LucideIcon name="gift" size={rf(15)} color={webColors.purple} />
            <Text style={styles.cardTitle}>Reward Menu Settings</Text>
          </View>

          <View style={styles.cardCallout}>
            <WebCallout>
              <CalloutText>
                <CalloutStrong>What this does:</CalloutStrong> the reward menu is a paid tip list
                shown to your Fan Club subscribers during a live session — fans pay coins to redeem
                a perk like a shoutout or a song request, and the coins go straight to your
                earnings. <CalloutStrong>Toggle status</CalloutStrong> to hide a reward without
                deleting it.{' '}
                <LearnLink
                  label="Learn more about pricing rewards"
                  onPress={() =>
                    showToast(
                      "Reward menu best-practice guide isn't part of this concept pass yet",
                      'info',
                    )
                  }
                />
              </CalloutText>
            </WebCallout>
          </View>

          {/* .reward-head-row — 1fr 90px 60px 24px */}
          <View style={styles.rewardHeadRow}>
            <Text style={styles.headCellLeft}>Activity</Text>
            <Text style={styles.headCellPrice}>Price</Text>
            <Text style={styles.headCellStatus}>Status</Text>
            <View style={styles.headCellGap} />
          </View>

          {loadingRewards ? (
            <View style={styles.rewardTable}>
              <Skeleton height={39} round={10} />
              <Skeleton height={39} round={10} />
              <Skeleton height={39} round={10} />
            </View>
          ) : (
            <View style={styles.rewardTable}>
              {rewardRows.map((row) => (
                <RewardTableRow
                  key={row.id}
                  row={row}
                  updateRewardRow={updateRewardRow}
                  removeRewardRow={removeRewardRow}
                />
              ))}
            </View>
          )}

          <Pressable
            onPress={addRewardRow}
            style={styles.btnAdd}
            accessibilityRole="button"
            accessibilityLabel="Add a reward"
          >
            <Text style={styles.btnAddLabel}>+ Add Reward</Text>
          </Pressable>

          <View style={styles.btnRow}>
            <Pressable
              onPress={saveRewards}
              disabled={savingRewards}
              style={styles.btnPrimary}
              accessibilityRole="button"
              accessibilityState={{ disabled: savingRewards, busy: savingRewards }}
              accessibilityLabel="Save and activate"
            >
              <LinearGradient
                colors={webGradients.activePill}
                start={gradientDirection.diagonal.start}
                end={gradientDirection.diagonal.end}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.btnPrimaryLabel}>
                {savingRewards ? 'Saving…' : 'Save & Activate'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => rewards && seedRewardRows(rewards)}
              style={styles.btnGhost}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.btnGhostLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* ── Section: Fun Wheel Settings ────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.cardH3}>
            <LucideIcon name="disc" size={rf(15)} color={webColors.purple} />
            <Text style={styles.cardTitle}>Fun Wheel Settings</Text>
          </View>

          <View style={styles.cardCallout}>
            <WebCallout tone="pink">
              <CalloutText>
                <CalloutStrong>How it works:</CalloutStrong> fans pay the spin price in coins to
                spin your wheel live on stream. The result is picked at random from the activities
                list, so keep a healthy mix of low-cost and high-value perks to keep spins feeling
                fair. The wheel only appears on viewer screens while it&apos;s actively spinning.
              </CalloutText>
            </WebCallout>
          </View>

          {loadingWheel ? (
            <View style={styles.rewardTable}>
              <Skeleton height={46} round={23} />
              <Skeleton height={39} round={10} />
              <Skeleton height={39} round={10} />
            </View>
          ) : (
            <>
              {/* .wheel-head */}
              <View style={styles.wheelHead}>
                <WheelVisual />
                <View style={styles.wheelTitle}>
                  <Text style={styles.wheelName}>FUN WHEEL</Text>
                  <Text style={styles.wheelSub}>
                    Spins live on your broadcast when a fan pays to play.
                  </Text>
                </View>
                <Switch
                  value={wheelOn}
                  onValueChange={toggleWheel}
                  disabled={!wheel || savingWheel}
                  trackColor={{ false: webColors.panelBorder, true: webColors.pinkHot }}
                  thumbColor={palette.white}
                  accessibilityLabel="Fun wheel enabled"
                />
              </View>

              {/* .wheel-on-badge */}
              <View style={wheelOn ? styles.wheelBadge : styles.wheelBadgeOff}>
                <Text style={wheelOn ? styles.wheelBadgeText : styles.wheelBadgeTextOff}>
                  ● {wheelOn ? 'ON' : 'OFF'}
                </Text>
              </View>

              {/* .field — Name of Wheel */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Name of Wheel (up to 20 characters)</Text>
                <TextInput
                  value={wheelName}
                  onChangeText={setWheelName}
                  editable={Boolean(wheel) && !savingWheel}
                  maxLength={20}
                  placeholder="Fun Wheel"
                  placeholderTextColor={webColors.dim}
                  style={[styles.fieldInput, styles.fieldValue]}
                  accessibilityLabel="Name of wheel"
                />
              </View>

              {/* .field — Price per Spin */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Price per Spin (coins)</Text>
                <TextInput
                  value={wheelPrice}
                  onChangeText={(t) => setWheelPrice(sanitizeDigits(t))}
                  editable={Boolean(wheel) && !savingWheel}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={webColors.dim}
                  style={[styles.fieldInput, styles.fieldValue]}
                  accessibilityLabel="Price per spin"
                />
              </View>

              {/* .field — Activities */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Activities (between 6 and 20)</Text>

                {/* .activity-list-head — 1fr 52px 44px 20px */}
                <View style={styles.activityHead}>
                  <Text style={styles.headCellLeft}>Activity</Text>
                  <Text style={styles.actHeadWeight}>Weight</Text>
                  <Text style={styles.actHeadPct}>Win %</Text>
                  <View style={styles.actHeadGap} />
                </View>

                <View style={styles.activityList}>
                  {slices.map((slice) => (
                    <ActivityRow
                      key={slice.id}
                      slice={slice}
                      editable={Boolean(wheel) && !savingWheel}
                      totalWeight={totalWeight}
                      updateSliceName={updateSliceName}
                      updateSliceWeight={updateSliceWeight}
                      removeSlice={removeSlice}
                    />
                  ))}
                </View>

                <Text style={styles.activityHint}>
                  Higher weight = more likely to be picked when a fan spins. Equal weights = equal
                  chance.
                </Text>

                <Pressable
                  onPress={addSlice}
                  style={styles.btnAdd}
                  accessibilityRole="button"
                  accessibilityLabel="Add an activity"
                >
                  <Text style={styles.btnAddLabel}>+ Add Activities</Text>
                </Pressable>
              </View>

              <View style={styles.btnRow}>
                <Pressable
                  onPress={saveWheel}
                  disabled={!wheel || savingWheel}
                  style={styles.btnPrimary}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !wheel || savingWheel, busy: savingWheel }}
                  accessibilityLabel="Save"
                >
                  <LinearGradient
                    colors={webGradients.activePill}
                    start={gradientDirection.diagonal.start}
                    end={gradientDirection.diagonal.end}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.btnPrimaryLabel}>
                    {savingWheel ? 'Saving…' : 'Save'}
                  </Text>
                </Pressable>
                {wheel ? (
                  <Pressable
                    onPress={deleteWheel}
                    disabled={savingWheel}
                    style={styles.btnDanger}
                    accessibilityRole="button"
                    accessibilityLabel="Delete wheel"
                  >
                    <Text style={styles.btnDangerLabel}>Delete Wheel</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>
      </Screen>

      <DeleteWheelConflictModal
        visible={deleteConflict !== null}
        message={deleteConflict}
        onClose={closeDeleteConflict}
        onConfirm={turnOffInstead}
        confirming={savingWheel}
      />
    </View>
  );
};

export default SettingsScreen;
