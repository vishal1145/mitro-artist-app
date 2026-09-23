import { useCallback, useEffect, useState } from 'react';

import { queryKeys } from '@constants';
import { useFunWheel, useRewardMenu } from '@hooks/useCreatorSettings';
import { settingsApi } from '@services/api';
import { queryClient } from '@services/queryClient';
import type { FunWheel, RewardMenuItem } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { showToast } from '@utils/toast';

import {
  canAddSlice,
  canRemoveSlice,
  clampWeight,
  computeTotalWeight,
  isValidWheelName,
  isValidWheelPrice,
  sanitizeDigits,
} from './schema';
import type { RewardRow, Slice } from './types';

export interface UseSettingsResult {
  rewards: RewardMenuItem[] | undefined;
  loadingRewards: boolean;
  rewardRows: RewardRow[];
  savingRewards: boolean;
  seedRewardRows: (list?: RewardMenuItem[]) => void;
  addRewardRow: () => void;
  removeRewardRow: (id: string | number) => void;
  updateRewardRow: (
    id: string | number,
    field: 'name' | 'price' | 'isActive',
    value: string | boolean,
  ) => void;
  saveRewards: () => void;

  wheel: FunWheel | null | undefined;
  loadingWheel: boolean;
  slices: Slice[];
  addSlice: () => void;
  removeSlice: (id: string) => void;
  updateSliceName: (id: string, val: string) => void;
  updateSliceWeight: (id: string, val: string) => void;
  totalWeight: number;

  wheelName: string;
  setWheelName: (v: string) => void;
  wheelPrice: string;
  setWheelPrice: (v: string) => void;
  wheelOn: boolean;
  savingWheel: boolean;
  saveWheel: () => void;
  toggleWheel: (next: boolean) => void;

  deleteConflict: string | null;
  closeDeleteConflict: () => void;
  deleteWheel: () => void;
  turnOffInstead: () => void;
}

/**
 * Settings — Reward Menu + Fun Wheel state and handlers, ported 1:1 from the
 * screen component. The screen renders state; it holds none.
 */
export const useSettings = (): UseSettingsResult => {
  // Data layer untouched — same hooks as before.
  const { data: rewards, isLoading: loadingRewards } = useRewardMenu();
  const { data: wheel, isLoading: loadingWheel } = useFunWheel();

  /*
   * Reward menu — inline editable rows, matching the web's
   * `RewardMenuSettingsUI`: "+ Add Reward" appends a draft row you fill in
   * place, then "Save & Activate" persists every row at once (new rows are
   * created, existing rows updated, and each row's on/off toggle synced).
   */
  const [rewardRows, setRewardRows] = useState<RewardRow[]>([]);
  const [savingRewards, setSavingRewards] = useState(false);

  const seedRewardRows = useCallback((list?: RewardMenuItem[]) => {
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
  const [slices, setSlices] = useState<Slice[]>([]);

  const addSlice = () => {
    if (!canAddSlice(slices.length)) {
      showToast('Maximum 20 activities.', 'info');
      return;
    }
    setSlices((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, activityName: '', weight: '1', isNew: true },
    ]);
  };
  const removeSlice = (id: string) => {
    if (!canRemoveSlice(slices.length)) {
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
      prev.map((s) => (s.id === id ? { ...s, weight: sanitizeDigits(val) } : s)),
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
    if (!isValidWheelName(name)) {
      showToast('Give the wheel a name first.', 'error');
      return;
    }
    if (!isValidWheelPrice(price)) {
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
        const weight = clampWeight(slice.weight);
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

  const totalWeight = computeTotalWeight(slices);

  return {
    rewards,
    loadingRewards,
    rewardRows,
    savingRewards,
    seedRewardRows,
    addRewardRow,
    removeRewardRow,
    updateRewardRow,
    saveRewards: () => void saveRewards(),

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
    saveWheel: () => void saveWheel(),
    toggleWheel: (next: boolean) => void toggleWheel(next),

    deleteConflict,
    closeDeleteConflict: () => setDeleteConflict(null),
    deleteWheel: () => void deleteWheel(),
    turnOffInstead: () => void turnOffInstead(),
  };
};
