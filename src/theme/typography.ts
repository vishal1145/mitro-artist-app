import type { TextStyle } from 'react-native';

import { rf } from '@utils/responsive';

/**
 * Typography — Plus Jakarta Sans throughout, ported from the Mitro user app.
 * With custom fonts the weight is baked into the family name, so variants set
 * `fontFamily` rather than `fontWeight`.
 */

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',

  // Legacy aliases — every role now resolves to Jakarta.
  display: 'PlusJakartaSans_800ExtraBold',
  heading: 'PlusJakartaSans_700Bold',
  headingSemibold: 'PlusJakartaSans_600SemiBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemibold: 'PlusJakartaSans_600SemiBold',
  mono: 'PlusJakartaSans_500Medium',
  monoSemibold: 'PlusJakartaSans_700Bold',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/** Spec sizes. */
export const fontSize = {
  h1: rf(26),
  h2: rf(21),
  h3: rf(17),
  bodyLg: rf(14),
  body: rf(13),
  bodySm: rf(12),
  label: rf(11),
  numHero: rf(40),
  numLg: rf(28),

  // Legacy scale aliases.
  xs: rf(11),
  sm: rf(13),
  md: rf(15),
  lg: rf(16),
  xl: rf(20),
  xxl: rf(24),
  xxxl: rf(30),
  display: rf(40),
  subtitle: rf(16),
} as const;

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'numHero'
  | 'numLg'
  // Legacy variant names still used by screens.
  | 'display'
  | 'bodyLarge'
  | 'subtitle'
  | 'caption'
  | 'legal'
  | 'link'
  | 'button';

export const typography: Record<TypographyVariant, TextStyle> = {
  // --- Spec ---
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.h1,
    lineHeight: rf(32),
  },
  h2: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.h2,
    lineHeight: rf(27),
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h3,
    lineHeight: rf(23),
  },
  bodyLg: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(20),
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    lineHeight: rf(19),
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySm,
    lineHeight: rf(17),
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.label,
    lineHeight: rf(14),
    // 0.08em at 11px.
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  numHero: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.numHero,
    lineHeight: rf(44),
    letterSpacing: -0.5,
  },
  numLg: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.numLg,
    lineHeight: rf(32),
  },

  // --- Legacy aliases ---
  /** Was the auth hero number/title — now the spec's numHero. */
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.numHero,
    lineHeight: rf(44),
    letterSpacing: -0.5,
  },
  bodyLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(22),
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(24),
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySm,
    lineHeight: rf(18),
  },
  legal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySm,
    lineHeight: rf(18),
  },
  link: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(22),
  },
  button: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(22),
  },
};
