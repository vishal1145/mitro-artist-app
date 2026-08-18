import { colors, gradientGlow, gradients, palette } from './colors';
import { HIT_TARGET, radius, spacing } from './spacing';
import {
  fontFamily,
  fontSize,
  fontWeight,
  typography,
} from './typography';

export type { ColorToken, GradientToken, CtaGradientToken } from './colors';
export type { SpacingToken, RadiusToken } from './spacing';
export type { TypographyVariant } from './typography';

export {
  colors,
  gradients,
  gradientGlow,
  palette,
  spacing,
  radius,
  HIT_TARGET,
  typography,
  fontFamily,
  fontWeight,
  fontSize,
};

/** Convenience aggregate for consumers that want the whole theme object. */
export const theme = {
  colors,
  spacing,
  radius,
  typography,
} as const;

export type Theme = typeof theme;
