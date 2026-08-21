/** Display formatters. Kept here so the same number reads the same everywhere. */

/**
 * Compact count: 940 → "940", 1240 → "1.2k", 48_200 → "48.2K".
 *
 * Uppercase K past a thousand and lowercase k below ten thousand matches the
 * design's own mix — "1.2k tk" next to "48.2K followers".
 */
export const compactCount = (value: number): string => {
  if (value < 1000) {
    return String(value);
  }
  if (value < 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
};

/** Token balance with its unit, e.g. 1240 → "1.2k tk". */
export const formatTokens = (value: number): string =>
  `${compactCount(value)} tk`;

/** Two-letter monogram for an avatar fallback. */
export const initialsFrom = (name: string | undefined | null): string =>
  (name ?? '?').slice(0, 2).toUpperCase();

/** "pending" → "Pending". Server statuses arrive lowercase. */
export const titleCase = (value: string): string =>
  value.length ? value[0].toUpperCase() + value.slice(1) : value;

/** ISO timestamp → "Aug 17", in the device's timezone. */
export const shortDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Seconds → "44s" / "9m" / "1h 20m".
 *
 * Seconds only show below a minute; past that they're noise on a summary row.
 */
export const duration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.max(0, Math.round(seconds))}s`;
  }
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/** Weekday initial-cap short name for a chart axis: "2026-08-17" → "Mon". */
export const shortWeekday = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { weekday: 'short' });
};
