import type { RewardRow, Slice } from './types';

/* Between 6 and 20 rows, exactly like the web. */
export const MIN_ACTIVITIES = 6;
export const MAX_ACTIVITIES = 20;

export const canAddSlice = (currentCount: number): boolean => currentCount < MAX_ACTIVITIES;
export const canRemoveSlice = (currentCount: number): boolean => currentCount > MIN_ACTIVITIES;

export const sanitizeDigits = (v: string): string => v.replace(/[^0-9]/g, '');

export const clampWeight = (weight: string): number =>
  Math.min(1000, Math.max(1, Math.trunc(Number(weight) || 1)));

/* `.activity-weight-pct` — the web divides each weight by the running total. */
export const computeTotalWeight = (slices: Slice[]): number =>
  slices.reduce((sum, s) => sum + (Number(s.weight) || 0), 0) || 1;

export const sliceWinPercent = (weight: string, totalWeight: number): string =>
  (((Number(weight) || 0) / totalWeight) * 100).toFixed(1);

export const isValidWheelName = (name: string): boolean => !!name.trim();

export const isValidWheelPrice = (price: number): boolean =>
  Number.isFinite(price) && price >= 0;

/** New rows (numeric temp id) are created; existing rows (string id) are
 *  updated — the same branch the web's handleSave takes. */
export const isExistingRewardRow = (row: RewardRow): row is RewardRow & { id: string } =>
  typeof row.id === 'string';
