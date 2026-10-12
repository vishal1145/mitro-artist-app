/**
 * Spacing, radius and geometry — per DESIGN_SYSTEM.md.
 *
 * These are fixed points, not responsive percentages, so the artist app
 * measures identically to the user app on every device.
 */

/** Base spacing scale. Gaps between stacked elements use 6/8/10/12/14/16 only. */
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  sectionGap: 32,
} as const;

/**
 * Corner radii. The base scale first, then the component-specific values the
 * spec calls out — those win for the named components.
 */
export const radius = {
  // Artist Web: --radius-xs 4 (tags), --radius-base 8 (cards, buttons, inputs,
  // images), --radius-circle 66 (pills), --radius-round 50% (avatars, dots).
  xs: 4,
  sm: 8,
  md: 8,
  lg: 8,
  pill: 999,

  /** Hero / large cards: same base radius as everything else on the web. */
  hero: 8,
  card: 8,
  input: 8,
  button: 8,
  chip: 8,
  iconChip: 8,
  /** Floating tab bar is mobile-only (no web equivalent): unchanged. */
  navPill: 26,

  // Legacy aliases.
  none: 0,
  xl: 8,
  xxl: 8,
  full: 999,
} as const;

/** Fixed element heights / sizes. */
export const size = {
  /** Web --size-control is 40; mobile keeps the 44pt minimum touch target. */
  input: 44,
  /** Full-width primary CTA (44pt minimum touch target). */
  cta: 44,
  /** Compact gradient chip button. */
  ctaCompact: 28,
  /** Filter pills / tabs. */
  pill: 32,
  iconChip: 48,
  avatar: 44,
  tabIconPillWidth: 80,
  tabIconPillHeight: 52,
} as const;

/** Padding and gap constants. */
export const layout = {
  /**
   * Screen horizontal gutter — the ONLY place screen-edge spacing is set.
   *
   * This is the dashboard's gap, and the dashboard is the reference for the
   * whole app. `Screen` applies it once (to its `padded` body and to its
   * header slot); a screen that opts out with `padded={false}` applies it
   * once on its own content container instead. Never both, and never again
   * on a wrapper inside the content — that is what made every non-dashboard
   * screen sit further from the edge than this one.
   */
  screenPadding: 12,
  /** Cards: 20–22 top/sides, 18 bottom. */
  cardPadding: 16,
  cardPaddingBottom: 16,
  inputPadding: 16,
  fieldGap: 12,
  sectionGap: 16,

  /** Floating tab bar. */
  navInsetX: 14,
  navInsetBottom: 10,
  navBlur: 18,
  navHeight: 64,
  navPaddingY: 6,
  navRadius: 26,

  /** Live tab circle: most of it sits inside the bar, the rest breaks above. */
  liveCircle: 56,
  liveOutsideRatio: 0.36,
  /** Screen-coloured collar separating the circle from the bar. */
  liveRing: 5,
} as const;

/** How far the raised Live button reaches above the bar's top edge. */
const LIVE_OVERHANG = layout.liveCircle * layout.liveOutsideRatio + layout.liveRing;

/**
 * Vertical space a scrollable screen must reserve so its last row clears the
 * floating tab bar and the raised Live button above it.
 *
 * Measured from the bottom of the safe area (which `Screen` already insets),
 * so it covers the bar's inset, its height, the button overhang and a gap. Do
 * NOT add the safe-area bottom on top — that double-counts on notched phones
 * while still clipping on devices with button navigation.
 */
export const TAB_BAR_SPACE =
  layout.navInsetBottom + layout.navHeight + LIVE_OVERHANG + 16;

/** Minimum accessible touch target (44x44pt per WCAG / HIG). */
export const HIT_TARGET = 44;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type SizeToken = keyof typeof size;
export type LayoutToken = keyof typeof layout;
