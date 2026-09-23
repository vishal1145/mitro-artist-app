/** `.metric-tile`/`.bd-row` bar fill percentage, clamped to a valid 0–100 range. */
export const clampPct = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));
