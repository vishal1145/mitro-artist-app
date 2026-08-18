import { wp } from '@utils/responsive';

/**
 * Spacing scale (responsive). All padding/margin/gap should pull from here
 * rather than using raw numbers, so layout stays proportional across devices.
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
  /** Gap above/below a primary CTA button (~40 on a 375-400pt screen). */
  sectionGap: wp(10),
} as const;

/** Border radius scale (responsive). */
export const radius = {
  none: 0,
  sm: wp(2), // ~8
  md: wp(3), // ~12
  lg: wp(4), // ~16
  xl: wp(6), // ~24
  /** Large hero-card corner radius (~32 on a 375-400pt screen). */
  xxl: wp(8),
  pill: wp(100),
  full: 9999,
} as const;

/** Minimum accessible touch target (44x44pt per WCAG / HIG). */
export const HIT_TARGET = 44;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
