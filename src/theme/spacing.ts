import { wp } from '@utils/responsive';

/**
 * Geometry — ported from the Mitro user app. The spec values are fixed points
 * (not responsive percentages), so they are expressed literally.
 */

/** Corner radii. */
export const radius = {
  input: 18,
  button: 18,
  card: 20,
  iconChip: 14,
  navPill: 28,
  pill: 999,

  // Legacy aliases.
  none: 0,
  sm: 8,
  md: 18,
  lg: 20,
  xl: 20,
  xxl: 20,
  full: 999,
} as const;

/** Fixed element heights / sizes. */
export const size = {
  input: 50,
  cta: 52,
  iconChip: 48,
  avatar: 44,
  /** Active tab gradient pill sits behind the icon only. */
  tabIconPillWidth: 80,
  tabIconPillHeight: 52,
} as const;

/** Padding and gap scale. */
export const layout = {
  screenPadding: 20,
  cardPadding: 18,
  inputPadding: 16,
  fieldGap: 10,
  sectionGap: 18,
  /** Floating tab bar inset from the screen edges. */
  navInsetX: 14,
  navInsetBottom: 10,
  navBlur: 18,
  navHeight: 64,
  navPaddingY: 6,
  navRadius: 26,
  /** Live tab circle: most of it sits inside the bar, the rest breaks above. */
  liveCircle: 56,
  liveOutsideRatio: 0.36,
  /** Screen-coloured collar that separates the circle from the bar. */
  liveRing: 5,
} as const;

/** How far the raised Live button reaches above the bar's top edge. */
const LIVE_OVERHANG = layout.liveCircle * layout.liveOutsideRatio + layout.liveRing;

/**
 * Vertical space a scrollable screen must reserve so its last row clears the
 * floating tab bar. The bar sits outside layout flow, so nothing reserves it
 * automatically.
 *
 * Measured from the bottom of the safe area (which `Screen` already insets),
 * so it must cover the bar's own inset, its height, the raised Live button
 * that overhangs it, and a breathing gap. Do NOT add the safe-area bottom on
 * top of this — that double-counts and leaves a dead band on notched phones,
 * while still clipping on devices with button navigation.
 */
export const TAB_BAR_SPACE =
  layout.navInsetBottom + layout.navHeight + LIVE_OVERHANG + 16;

/**
 * Spacing scale. Kept responsive for existing screens, with the spec's fixed
 * values available via `layout` above.
 */
export const spacing = {
  none: 0,
  xxs: wp(1), // ~4
  xs: wp(2), // ~8
  sm: wp(3), // ~12
  md: wp(4), // ~16
  lg: wp(6), // ~24
  xl: wp(8), // ~32
  xxl: wp(12), // ~48
  xxxl: wp(16), // ~64
  sectionGap: wp(10),
} as const;

/** Minimum accessible touch target (44x44pt per WCAG / HIG). */
export const HIT_TARGET = 44;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type SizeToken = keyof typeof size;
export type LayoutToken = keyof typeof layout;
