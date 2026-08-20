import type { TextStyle } from 'react-native';

import { rf } from '@utils/responsive';

/**
 * Typography — Plus Jakarta Sans, per DESIGN_SYSTEM.md.
 *
 * Always set `fontFamily`, never `fontWeight`. The weight is baked into the
 * family name, and setting both makes Android fake-bold an already-bold face,
 * which renders muddy.
 */

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',

  // Legacy aliases — every role resolves to Jakarta.
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

/**
 * Sizes come from the spec's role table. Each value sits inside its allowed
 * band — do not use arbitrary sizes outside this scale.
 *
 *   Display / hero value  28–34  extrabold
 *   H1                    22–28  extrabold
 *   H2 / card title       15–16  extrabold or bold
 *   Body                  14–16  medium or semibold
 *   Label / button text   13–14.5 bold or extrabold
 *   Small / meta          11–13.5 regular / medium / semibold
 *   Micro (uppercase)     10–11  bold, tracking 0.5–1.4
 */
export const fontSize = {
  numHero: rf(30),
  numLg: rf(28),
  h1: rf(23),
  h2: rf(16),
  h3: rf(15),
  body: rf(14),
  bodyLg: rf(14),
  bodySm: rf(12),
  label: rf(10),

  // Legacy scale aliases.
  xs: rf(11),
  sm: rf(12),
  md: rf(14),
  lg: rf(15),
  xl: rf(16),
  xxl: rf(23),
  xxxl: rf(28),
  display: rf(30),
  subtitle: rf(14),
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
  // --- Spec roles ---
  /** Display / hero value. */
  numHero: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.numHero,
    lineHeight: rf(36),
    letterSpacing: -0.5,
  },
  numLg: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.numLg,
    lineHeight: rf(34),
  },
  h1: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.h1,
    lineHeight: rf(28),
  },
  /** H2 / card title. */
  h2: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.h2,
    lineHeight: rf(22),
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h3,
    lineHeight: rf(20),
  },
  body: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    lineHeight: rf(20),
  },
  /** Label / button text. */
  bodyLg: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(20),
  },
  /** Small / meta. */
  bodySm: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.bodySm,
    lineHeight: rf(17),
  },
  /** Micro — uppercase tags. */
  label: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.label,
    lineHeight: rf(13),
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },

  // --- Legacy aliases ---
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.numHero,
    lineHeight: rf(36),
    letterSpacing: -0.5,
  },
  bodyLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.body,
    lineHeight: rf(20),
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.subtitle,
    lineHeight: rf(21),
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.bodySm,
    lineHeight: rf(17),
  },
  legal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySm,
    lineHeight: rf(17),
  },
  link: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(20),
  },
  button: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.bodyLg,
    lineHeight: rf(20),
  },
};
