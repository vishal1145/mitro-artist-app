import {
  authGlow,
  colors,
  gradientDirection,
  gradientGlow,
  gradients,
  palette,
} from './colors';
import { HIT_TARGET, layout, radius, size, spacing, TAB_BAR_SPACE } from './spacing';
import { fontFamily, fontSize, fontWeight, typography } from './typography';

export type {
  ColorToken,
  GradientToken,
  CtaGradientToken,
} from './colors';
export type {
  SpacingToken,
  RadiusToken,
  SizeToken,
  LayoutToken,
} from './spacing';
export type { TypographyVariant } from './typography';

export {
  colors,
  gradients,
  gradientDirection,
  gradientGlow,
  authGlow,
  palette,
  spacing,
  radius,
  size,
  layout,
  TAB_BAR_SPACE,
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
  size,
  layout,
  typography,
} as const;

export type Theme = typeof theme;
