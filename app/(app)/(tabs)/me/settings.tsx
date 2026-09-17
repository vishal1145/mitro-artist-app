import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  CalloutStrong,
  CalloutText,
  LearnLink,
  WebCallout,
} from '@components/history';
import { Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { useFunWheel, useRewardMenu } from '@hooks/useCreatorSettings';
import { queryKeys } from '@constants';
import { settingsApi } from '@services/api';
import { queryClient } from '@services/queryClient';
import { fontFamily, gradientDirection, palette, webColors, webGradients } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';
import { showToast } from '@utils/toast';

/**
 * Settings — a replica of the Artist Web's `.creator-settings-page` at mobile
 * widths (main.tsx:1733–1800, `RewardMenuSettingsUI` 8021–8139,
 * `FunWheelSettingsUI` 8142–8479; styles.css `.creator-settings-page` block).
 *
 * `.grid-2` collapses to one column at `@media (max-width: 920px)`, so the two
 * cards stack on a phone. Page gutter is 12px, per the `@media (max-width:
 * 768px) { .creator-main { padding: 12px !important } }` rule.
 */

/** `.wheel-visual` — a 6-stop conic gradient on the web; drawn as six 60°
 *  wedges here because React Native has no conic gradient. Same colours,
 *  same order, same angles. */
const WheelVisual = () => (
  <View style={styles.wheelVisual}>
    <Svg width={40} height={40} viewBox="0 0 100 100">
      {webColors.wheelSlices.map((fill, i) => {
        const a0 = (i * 60 - 90) * (Math.PI / 180);
        const a1 = ((i + 1) * 60 - 90) * (Math.PI / 180);
        const x0 = 50 + 50 * Math.cos(a0);
        const y0 = 50 + 50 * Math.sin(a0);
        const x1 = 50 + 50 * Math.cos(a1);
        const y1 = 50 + 50 * Math.sin(a1);
        return (
          <Path key={fill} d={`M50 50 L${x0} ${y0} A50 50 0 0 1 ${x1} ${y1} Z`} fill={fill} />
        );
      })}
    </Svg>
  </View>
);

const SettingsScreen = () => {
  const router = useRouter();

  // Data layer untouched — same hooks as before.
  const { data: rewards, isLoading: loadingRewards } = useRewardMenu();
  const { data: wheel, isLoading: loadingWheel } = useFunWheel();

  /*
   * Reward menu — inline editable rows, matching the web's
   * `RewardMenuSettingsUI`: "+ Add Reward" appends a draft row you fill in
   * place, then "Save & Activate" persists every row at once (new rows are
   * created, existing rows updated, and each row's on/off toggle synced).
   */
  type RewardRow = {
    id: string | number;
    name: string;
    price: string;
    isActive: boolean;
  };
  const [rewardRows, setRewardRows] = useState<RewardRow[]>([]);
  const [savingRewards, setSavingRewards] = useState(false);

  const seedRewardRows = useCallback((list: typeof rewards) => {
    setRewardRows(
      (list ?? []).map((r) => ({
        id: r.id,
        name: r.rewardName,
        price: String(r.rewardTokens),
        isActive: r.isActive,
      })),
    );
  }, []);

  // Seed the editable rows from the server list, and re-seed after each save.
  useEffect(() => {
    if (rewards) seedRewardRows(rewards);
  }, [rewards, seedRewardRows]);

  const addRewardRow = () =>
    setRewardRows((prev) => [
      ...prev,
      { id: Date.now(), name: '', price: '', isActive: true },
    ]);
  const removeRewardRow = (id: string | number) =>
    setRewardRows((prev) => prev.filter((r) => r.id !== id));
  const updateRewardRow = (
    id: string | number,
    field: 'name' | 'price' | 'isActive',
    value: string | boolean,
  ) =>
    setRewardRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  // New rows (numeric temp id) are created; existing rows (string id) are
  // updated and their toggle synced — the same branch the web's handleSave takes.
  const saveRewards = async () => {
    if (savingRewards) return;
    setSavingRewards(true);
    try {
      for (const row of rewardRows) {
        if (!row.name.trim() || row.price === '') continue;
        const tokens = Number(row.price);
        if (typeof row.id === 'string') {
          const up = await settingsApi.updateReward(row.id, {
            rewardName: row.name.trim(),
            rewardTokens: tokens,
            description: null,
          });
          if (!up.success) throw new Error(up.error);
          const st = await settingsApi.setRewardActive(row.id, row.isActive);
          if (!st.success) throw new Error(st.error);
        } else {
          const created = await settingsApi.createReward({
            rewardName: row.name.trim(),
            rewardTokens: tokens,
            description: null,
          });
          if (!created.success) throw new Error(created.error);
          if (!row.isActive && created.data.id) {
            await settingsApi.setRewardActive(created.data.id, false);
          }
        }
      }
      showToast('Rewards saved successfully!', 'success');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settings.rewardMenu(),
      });
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingRewards(false);
    }
  };

  /*
   * Fun-wheel activities — inline editable rows, matching the web's
   * `FunWheelSettingsUI`: "+ Add Activities" appends a draft row (name +
   * weight) you fill in place, and the wheel's "Save" persists the name/price
   * and every activity at once (new ones created, existing ones updated).
   * Between 6 and 20 rows, exactly like the web.
   */
  type Slice = {
    id: string;
    activityName: string;
    weight: string;
    isNew: boolean;
  };
  const [slices, setSlices] = useState<Slice[]>([]);

  const addSlice = () => {
    if (slices.length >= 20) {
      showToast('Maximum 20 activities.', 'info');
      return;
    }
    setSlices((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, activityName: '', weight: '1', isNew: true },
    ]);
  };
  const removeSlice = (id: string) => {
    if (slices.length <= 6) {
      showToast('Minimum 6 activities required.', 'info');
      return;
    }
    setSlices((prev) => prev.filter((s) => s.id !== id));
  };
  const updateSliceName = (id: string, val: string) =>
    setSlices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, activityName: val } : s)),
    );
  const updateSliceWeight = (id: string, val: string) =>
    setSlices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, weight: val.replace(/[^0-9]/g, '') } : s,
      ),
    );

  /* --------------------------- Fun wheel -------------------------------- */
  /* The wheel used to be read-only here because the app carried no write
     endpoints for it. `settingsApi` now mirrors the web's
     `artistSettingsService`, so the name, price, switch and Delete all
     actually persist. */
  const [wheelName, setWheelName] = useState('');
  const [wheelPrice, setWheelPrice] = useState('');
  const [wheelOn, setWheelOn] = useState(false);
  const [savingWheel, setSavingWheel] = useState(false);

  // Seed the fields once the wheel arrives, and whenever the server's copy
  // changes underneath us (a refetch after save).
  useEffect(() => {
    if (!wheel) return;
    setWheelName(wheel.wheelName);
    setWheelPrice(String(wheel.pricePerSpin));
    setWheelOn(wheel.isActive);
    // `activities` is optional in practice — a wheel can come back without the
    // array at all, so don't reach for `.length` on it directly.
    const activities = wheel.activities ?? [];
    setSlices(
      activities.length > 0
        ? activities.map((a) => ({
            id: a.id,
            activityName: a.activityName,
            weight: String(typeof a.weight === 'number' ? a.weight : 1),
            isNew: false,
          }))
        : Array.from({ length: 6 }).map((_, i) => ({
            id: `temp-${i}`,
            activityName: '',
            weight: '1',
            isNew: true,
          })),
    );
  }, [wheel]);

  const refreshWheel = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.funWheel() }),
    [],
  );

  const saveWheel = useCallback(async () => {
    if (!wheel || savingWheel) return;
    const name = wheelName.trim();
    const price = Number(wheelPrice);
    if (!name) {
      showToast('Give the wheel a name first.', 'error');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      showToast('Enter a valid price per spin.', 'error');
      return;
    }
    setSavingWheel(true);
    try {
      const res = await settingsApi.updateFunWheel(wheel.id, {
        wheelName: name,
        pricePerSpin: price,
      });
      if (!res.success) throw new Error(res.error);

      // Persist every activity row: new rows are created, existing rows
      // updated — the same branch the web's handleSave takes.
      for (const slice of slices) {
        if (!slice.activityName.trim()) continue;
        const weight = Math.min(
          1000,
          Math.max(1, Math.trunc(Number(slice.weight) || 1)),
        );
        if (slice.isNew) {
          const created = await settingsApi.createActivity({
            activityName: slice.activityName.trim(),
            weight,
          });
          if (!created.success) throw new Error(created.error);
        } else {
          const updated = await settingsApi.updateActivity(slice.id, {
            activityName: slice.activityName.trim(),
            weight,
          });
          if (!updated.success) throw new Error(updated.error);
        }
      }
      showToast('Fun wheel saved.', 'success');
      void refreshWheel();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingWheel(false);
    }
  }, [refreshWheel, savingWheel, slices, wheel, wheelName, wheelPrice]);

  const toggleWheel = useCallback(
    async (next: boolean) => {
      if (!wheel || savingWheel) return;
      setWheelOn(next); // optimistic — reverted below if the server says no
      setSavingWheel(true);
      const res = await settingsApi.setFunWheelActive(wheel.id, next);
      setSavingWheel(false);
      if (!res.success) {
        setWheelOn(!next);
        showToast(res.error, 'error');
        return;
      }
      void refreshWheel();
    },
    [refreshWheel, savingWheel, wheel],
  );

  /* Set when Delete Wheel comes back 409 (wheel has spin history) — surfaces
     the server's own message plus a one-click "Turn Off Instead" fallback,
     exactly as `main.tsx` 8153–8155 / 8326–8336 / 8459–8476 does. */
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null);

  const deleteWheel = useCallback(async () => {
    if (!wheel || savingWheel) return;
    setSavingWheel(true);
    const res = await settingsApi.deleteFunWheel(wheel.id);
    setSavingWheel(false);
    if (!res.success) {
      if (res.conflict) {
        // Expected/valid state — show the server's message, not a toast.
        setDeleteConflict(res.error);
        return;
      }
      showToast(res.error, 'error');
      return;
    }
    showToast('Fun wheel deleted.', 'success');
    void refreshWheel();
  }, [refreshWheel, savingWheel, wheel]);

  /** `.popup-btn-confirm` — `handleToggleActive(false)` then dismiss. */
  const turnOffInstead = useCallback(async () => {
    if (!wheel || savingWheel) return;
    setWheelOn(false);
    setSavingWheel(true);
    const res = await settingsApi.setFunWheelActive(wheel.id, false);
    setSavingWheel(false);
    if (!res.success) {
      setWheelOn(true);
      showToast(res.error, 'error');
      return;
    }
    showToast('Fun Wheel turned off — hidden from viewers.', 'success');
    setDeleteConflict(null);
    void refreshWheel();
  }, [refreshWheel, savingWheel, wheel]);

  // `.activity-weight-pct` — the web divides each weight by the running total.
  const totalWeight =
    slices.reduce((sum, s) => sum + (Number(s.weight) || 0), 0) || 1;
  const sliceWinPercent = (weight: string) =>
    (((Number(weight) || 0) / totalWeight) * 100).toFixed(1);

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
                <View key={row.id} style={styles.rewardRow}>
                  <TextInput
                    value={row.name}
                    onChangeText={(t) => updateRewardRow(row.id, 'name', t)}
                    placeholder="Reward Name (e.g. Shoutout)"
                    placeholderTextColor={webColors.dim}
                    style={styles.rewardInput}
                    accessibilityLabel="Reward name"
                  />
                  <TextInput
                    value={row.price}
                    onChangeText={(t) =>
                      updateRewardRow(row.id, 'price', t.replace(/[^0-9]/g, ''))
                    }
                    placeholder="Coins"
                    placeholderTextColor={webColors.dim}
                    keyboardType="number-pad"
                    style={styles.rewardPriceInput}
                    accessibilityLabel="Reward price in coins"
                  />
                  <View style={styles.switchCell}>
                    <Switch
                      value={row.isActive}
                      onValueChange={(next) => updateRewardRow(row.id, 'isActive', next)}
                      trackColor={{ false: webColors.panelBorder, true: webColors.pinkHot }}
                      thumbColor={palette.white}
                      accessibilityLabel={`${row.name || 'Reward'} status`}
                    />
                  </View>
                  {typeof row.id === 'number' ? (
                    <Pressable
                      onPress={() => removeRewardRow(row.id)}
                      hitSlop={8}
                      style={styles.rewardRm}
                      accessibilityRole="button"
                      accessibilityLabel="Remove reward"
                    >
                      <LucideIcon name="x" size={rf(14)} color={webColors.dim} />
                    </Pressable>
                  ) : (
                    <View style={styles.headCellGap} />
                  )}
                </View>
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
              onPress={() => void saveRewards()}
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
                  onChangeText={(t) => setWheelPrice(t.replace(/[^0-9]/g, ''))}
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
                    <View key={slice.id} style={styles.activityRow}>
                      <TextInput
                        value={slice.activityName}
                        onChangeText={(t) => updateSliceName(slice.id, t)}
                        placeholder="Write your activity"
                        placeholderTextColor={webColors.dim}
                        editable={Boolean(wheel) && !savingWheel}
                        style={styles.activityNameInput}
                        accessibilityLabel="Activity name"
                      />
                      <TextInput
                        value={slice.weight}
                        onChangeText={(t) => updateSliceWeight(slice.id, t)}
                        keyboardType="number-pad"
                        editable={Boolean(wheel) && !savingWheel}
                        style={styles.weightField}
                        accessibilityLabel="Activity weight"
                      />
                      <Text style={styles.activityPct}>
                        {slice.activityName ? `${sliceWinPercent(slice.weight)}%` : '—'}
                      </Text>
                      <Pressable
                        onPress={() => removeSlice(slice.id)}
                        hitSlop={8}
                        style={styles.activityRm}
                        accessibilityRole="button"
                        accessibilityLabel="Remove activity"
                      >
                        <LucideIcon name="x" size={rf(14)} color={webColors.dim} />
                      </Pressable>
                    </View>
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

      {/* `.popup-modal-overlay` > `.popup-modal` — main.tsx 8459–8476 */}
      <Modal
        visible={deleteConflict !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConflict(null)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupModal}>
            <Text style={styles.popupTitle}>Can&apos;t Delete This Wheel</Text>
            <Text style={styles.popupBody}>{deleteConflict}</Text>
            <View style={styles.popupActions}>
              <Pressable
                onPress={() => setDeleteConflict(null)}
                style={styles.popupCancel}
                accessibilityRole="button"
              >
                <Text style={styles.popupCancelLabel}>Close</Text>
              </Pressable>
              <Pressable
                onPress={() => void turnOffInstead()}
                disabled={savingWheel}
                style={styles.popupConfirm}
                accessibilityRole="button"
                accessibilityState={{ disabled: savingWheel, busy: savingWheel }}
              >
                <LinearGradient
                  colors={webGradients.popupConfirm}
                  start={gradientDirection.diagonal.start}
                  end={gradientDirection.diagonal.end}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.popupConfirmLabel}>
                  {savingWheel ? 'Turning off…' : 'Turn Off Instead'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** `.creator-main { padding: 12px }` at ≤768px; `.tab-panel` gap 16. */
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },

  /* .page-head ------------------------------------------------------------ */
  pageHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  /** `.creator-settings-back` — 36px circle, shown only at ≤768px. */
  backBtn: {
    alignItems: 'center',
    backgroundColor: webColors.chip,
    borderColor: webColors.circleBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headText: {
    flex: 1,
  },
  h1: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    letterSpacing: -0.22,
    lineHeight: rf(27),
    marginBottom: 4,
  },
  headSub: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(19),
  },

  /* .tab-bar -------------------------------------------------------------- */
  tabBar: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  tabBtn: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  tabBtnActive: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  tabLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },
  tabLabelActive: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },

  /* Section ---------------------------------------------------------------
   * Panel chrome intentionally removed: both settings groups sit flush on the
   * screen gutter (`content.paddingHorizontal: 12`) like every other screen,
   * with the 16px `content.gap` separating them. */
  section: {
    paddingTop: 4,
  },
  /**
   * The 3px the web used sat under a panel that supplied its own 20px of top
   * padding. With the outer box gone the heading landed almost on top of the
   * callout, so it carries the breathing room itself now — 12 here plus the
   * callout's own 2px top margin.
   */
  cardH3: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  /** `.creator-settings-page .info-callout { margin: 2px 0 16px }`. */
  cardCallout: {
    marginBottom: 16,
    marginTop: 2,
  },

  /* .reward-head-row / .reward-table / .reward-row ------------------------ */
  rewardHeadRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  headCellLeft: {
    color: webColors.dim,
    flex: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  headCellPrice: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'center',
    textTransform: 'uppercase',
    width: 90,
  },
  headCellStatus: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'center',
    textTransform: 'uppercase',
    width: 60,
  },
  headCellGap: {
    width: 24,
  },
  rewardTable: {
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  rewardRow: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rewardName: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  rewardPrice: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    textAlign: 'center',
    width: 90,
  },
  switchCell: {
    alignItems: 'center',
    width: 60,
  },
  rewardInput: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    padding: 0,
  },
  rewardPriceInput: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    padding: 0,
    textAlign: 'center',
    width: 90,
  },
  rewardRm: {
    alignItems: 'center',
    width: 24,
  },

  /* .btn-add / .btn-row / .btn-primary / .btn-ghost / .btn-danger --------- */
  btnAdd: {
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 10,
    width: '100%',
  },
  btnAddLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    /* Save/Cancel sit flush right, away from the left-aligned form above. */
    justifyContent: 'flex-end',
  },
  /** Rule closing off the reward menu before the fun wheel section starts. */
  sectionDivider: {
    backgroundColor: webColors.panelBorder,
    height: 1,
    marginBottom: 18,
    marginTop: 22,
  },
  btnPrimary: {
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnPrimaryLabel: {
    color: palette.white,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  btnGhost: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnGhostLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  btnDanger: {
    backgroundColor: webColors.dangerChip,
    borderColor: webColors.dangerChipBorder,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnDangerLabel: {
    color: webColors.dangerInk,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },

  /* .wheel-head / .wheel-visual / .wheel-title / .wheel-on-badge ---------- */
  wheelHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  /** 46px incl. the web's 3px ring; the SVG is the 40px inner disc. */
  wheelVisual: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 46,
  },
  wheelTitle: {
    flex: 1,
  },
  wheelName: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  wheelSub: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11),
    lineHeight: rf(15),
  },
  wheelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.greenPill,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  wheelBadgeOff: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  wheelBadgeText: {
    color: webColors.green,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(13),
  },
  wheelBadgeTextOff: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(13),
  },

  /* .field / .field-input -------------------------------------------------- */
  field: {
    marginBottom: 12,
    marginTop: 12,
  },
  fieldLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
    marginBottom: 5,
  },
  fieldInput: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  fieldValue: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },

  /* .activity-list-head / .activity-row ----------------------------------- */
  activityHead: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  actHeadWeight: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'center',
    textTransform: 'uppercase',
    width: 52,
  },
  actHeadPct: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'right',
    textTransform: 'uppercase',
    width: 44,
  },
  actHeadGap: {
    width: 20,
  },
  activityList: {
    gap: 7,
    marginBottom: 6,
  },
  activityRow: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  activityName: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  activityNameInput: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    padding: 0,
  },
  weightField: {
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 7,
    borderWidth: 1,
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    paddingHorizontal: 4,
    paddingVertical: 5,
    textAlign: 'center',
    width: 52,
  },
  weightInput: {
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    width: 52,
  },
  weightValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    textAlign: 'center',
  },
  activityPct: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
    textAlign: 'right',
    width: 44,
  },
  activityRm: {
    alignItems: 'center',
    width: 20,
  },
  activityHint: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(10.5),
    lineHeight: rf(15),
    marginBottom: 10,
  },

  /* .popup-modal ----------------------------------------------------------- */
  /** `.popup-modal-overlay` — full-bleed `rgba(0,0,0,.7)`, centred.
   *  The web also blurs the backdrop (`backdrop-filter: blur(4px)`), which
   *  React Native has no equivalent for inside a plain Modal. */
  popupOverlay: {
    alignItems: 'center',
    backgroundColor: webColors.popupScrim,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  /** `.popup-modal { width: 90%; max-width: 400px; padding: 24px; r12 }`. */
  popupModal: {
    backgroundColor: webColors.popupFill,
    borderColor: webColors.popupBorder,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 400,
    padding: 24,
    width: '90%',
  },
  /** `.popup-modal h3 { margin-top: 0; margin-bottom: 12px; color: #fff }` —
   *  a bare `h3`, so browser default 1.17rem bold. */
  popupTitle: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(18.7),
    lineHeight: rf(25),
    marginBottom: 12,
  },
  /** `.popup-modal p { color: #aaa; margin-bottom: 24px; font-size: .95rem }`. */
  popupBody: {
    color: webColors.popupBodyInk,
    fontFamily: fontFamily.regular,
    fontSize: rf(15.2),
    lineHeight: rf(23.5),
    marginBottom: 24,
  },
  /** `.popup-modal-actions { justify-content: flex-end; gap: 12px }`. */
  popupActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  /** `.popup-btn-cancel` — transparent, `1px solid #ffffff20`, 8/16, r8. */
  popupCancel: {
    alignItems: 'center',
    borderColor: webColors.popupBorder,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  popupCancelLabel: {
    color: palette.white,
    fontFamily: fontFamily.regular,
    fontSize: rf(15.2),
    lineHeight: rf(20),
  },
  /** `.popup-btn-confirm` — 135° #ff4757 → #ff6b81, no border, 8/16, r8, bold. */
  popupConfirm: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  popupConfirmLabel: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(15.2),
    lineHeight: rf(20),
  },
});

export default SettingsScreen;
