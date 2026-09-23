/* Web `SOURCE_PIE_COLORS`, verbatim. */
export const SOURCE_PIE_COLORS = [
  '#ff3fad',
  '#33e6ff',
  '#8c4dff',
  '#42f5a7',
  '#ffb84d',
  '#ff6b6b',
  '#4d9fff',
  '#f5d442',
] as const;

export const pieColor = (index: number): string =>
  SOURCE_PIE_COLORS[index % SOURCE_PIE_COLORS.length];

export interface PieSource {
  sourceType: string;
  tokens: number;
  count: number;
}

export interface PieSegment {
  sourceType: string;
  color: string;
  /** `strokeDasharray` — visible arc length, then the remainder of the ring. */
  len: number;
  gapRemainder: number;
  /** `strokeDashoffset` — negative running offset into the ring. */
  dashoffset: number;
}

/**
 * The `SourcePieChart` donut's per-segment geometry — extracted verbatim from
 * the accumulator-based loop that used to run inline in the component's
 * render. `totalTokens <= 0` degenerates every segment's `pct` to 0, matching
 * the original's ternary guard.
 */
export const pieSegments = (
  sources: PieSource[],
  totalTokens: number,
  r = 82,
): PieSegment[] => {
  const circumference = 2 * Math.PI * r;
  const gap = sources.length > 1 ? 7 : 0;
  let offsetAcc = 0;

  return sources.map((source, i) => {
    const pct = totalTokens > 0 ? source.tokens / totalTokens : 0;
    const rawLen = pct * circumference;
    const len = Math.max(rawLen - gap, pct > 0 ? 1 : 0);
    const dashoffset = -offsetAcc;
    offsetAcc += rawLen;
    return {
      sourceType: source.sourceType,
      color: pieColor(i),
      len,
      gapRemainder: circumference - len,
      dashoffset,
    };
  });
};

/** The legend row's percentage — rounded, zero-guarded against an empty total. */
export const legendPct = (tokens: number, totalTokens: number): number =>
  totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
