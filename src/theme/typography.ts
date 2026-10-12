import type { TextStyle } from 'react-native';

import { rf } from '@utils/responsive';

/**
 * Typography — the Mitro design system ("Dovetail" scale), see DESIGN.md.
 *
 * Two families only: Inter for all UI text, JetBrains Mono for labels, IDs,
 * timestamps, counts and badges. Weights stop at 600 (Inter 400 / 500 / 600,
 * JetBrains Mono 400).
 *
 * Always set `fontFamily`, never `fontWeight`. The weight is baked into the
 * family name, and setting both makes Android fake-bold an already-bold face,
 * which renders muddy.
 *
 * DESIGN.md is written in CSS px / em. React Native needs absolute numbers, so
 * line heights and letter spacings below are the doc's ratios already
 * multiplied by the size (e.g. heading: 24 × 1.33 = 32, 24 × -0.025 = -0.6).
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  /** DESIGN.md caps weight at 600, so the heavy aliases resolve to semibold. */
  bold: 'Inter_600SemiBold',
  extrabold: 'Inter_600SemiBold',
  /** JetBrains Mono — loads at 400 only. */
  mono: 'JetBrainsMono_400Regular',

  // Legacy aliases kept so existing call sites compile.
  display: 'Inter_600SemiBold',
  heading: 'Inter_600SemiBold',
  headingSemibold: 'Inter_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  monoSemibold: 'JetBrainsMono_400Regular',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '600',
  extrabold: '600',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/**
 * The Dovetail type scale (DESIGN.md §1.3). Nothing in the app is larger than
 * `headingLg`; `display` is reserved for marketing-style screens.
 */
export const fontSize = {
  display: rf(56),
  headingLg: rf(40),
  heading: rf(24),
  subheading: rf(20),
  body: rf(16),
  small: rf(14),
  mono: rf(12),
  monoLg: rf(14),
  /** Smallest UI text: captions, badges, meta. Alias of `mono`. */
  xs: rf(12),

  // Role aliases used by the variants below and by screens.
  numHero: rf(24),
  numLg: rf(24),
  h1: rf(24),
  h2: rf(16),
  h3: rf(14),
  bodyLg: rf(14),
  bodySm: rf(12),
  label: rf(12),
  eyebrow: rf(12),
  metric: rf(20),
  input: rf(14),
  buttonSm: rf(14),
  badge: rf(12),

  // Legacy scale aliases, snapped to the nearest token.
  sm: rf(12),
  md: rf(14),
  lg: rf(16),
  xl: rf(16),
  xxl: rf(24),
  xxxl: rf(24),
  subtitle: rf(14),
} as const;

/** Line heights, in px (DESIGN.md `--leading-*` × size). */
export const lineHeight = {
  display: rf(64),
  headingLg: rf(52),
  heading: rf(32),
  subheading: rf(28),
  body: rf(24),
  small: rf(20),
  mono: rf(17),
  monoLg: rf(20),
} as const;

/** Letter spacing, in px (DESIGN.md `--tracking-*` × size). */
export const letterSpacing = {
  display: -2.02,
  headingLg: -1.24,
  heading: -0.6,
  subheading: -0.42,
  body: -0.19,
  small: -0.17,
  mono: 0.85,
  monoLg: 1.16,
} as const;

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'eyebrow'
  | 'metric'
  | 'input'
  | 'buttonSm'
  | 'badge'
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

/** Reusable trios — size, line height and tracking always travel together. */
const roleHeadingLg: TextStyle = {
  fontSize: fontSize.headingLg,
  lineHeight: lineHeight.headingLg,
  letterSpacing: letterSpacing.headingLg,
};
const roleHeading: TextStyle = {
  fontSize: fontSize.heading,
  lineHeight: lineHeight.heading,
  letterSpacing: letterSpacing.heading,
};
const roleSubheading: TextStyle = {
  fontSize: fontSize.subheading,
  lineHeight: lineHeight.subheading,
  letterSpacing: letterSpacing.subheading,
};
const roleBody: TextStyle = {
  fontSize: fontSize.body,
  lineHeight: lineHeight.body,
  letterSpacing: letterSpacing.body,
};
const roleSmall: TextStyle = {
  fontSize: fontSize.small,
  lineHeight: lineHeight.small,
  letterSpacing: letterSpacing.small,
};
const roleMono: TextStyle = {
  fontFamily: fontFamily.mono,
  fontSize: fontSize.mono,
  lineHeight: lineHeight.mono,
  letterSpacing: letterSpacing.mono,
};

export const typography: Record<TypographyVariant, TextStyle> = {
  // --- Spec roles ---
  /** Stat number (earnings, followers). */
  numHero: { ...roleHeading, fontFamily: fontFamily.semibold },
  numLg: { ...roleHeading, fontFamily: fontFamily.semibold },
  /** Page title. */
  h1: { ...roleHeading, fontFamily: fontFamily.semibold },
  /** Card / section title. */
  h2: { ...roleBody, fontFamily: fontFamily.semibold },
  h3: { ...roleSmall, fontFamily: fontFamily.semibold },
  /** Primary text. */
  body: { ...roleSmall, fontFamily: fontFamily.regular },
  /** Label / button text. */
  bodyLg: { ...roleSmall, fontFamily: fontFamily.medium },
  /** Small / meta. */
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
    letterSpacing: letterSpacing.small,
  },
  /** Mono, uppercase — form labels, table headers, stat labels. */
  label: { ...roleMono, textTransform: 'uppercase' },

  /* --- Semantic roles ---------------------------------------------------- */

  /** Uppercase mono kicker sitting directly above an `h1` screen title. */
  eyebrow: { ...roleMono, textTransform: 'uppercase' },
  /** The figure in a summary/stat cell. */
  metric: { ...roleSubheading, fontFamily: fontFamily.semibold },
  /** Every `TextInput` in the app. */
  input: { ...roleSmall, fontFamily: fontFamily.regular },
  /** Dialog and inline buttons — one step below the full-width CTA. */
  buttonSm: { ...roleSmall, fontFamily: fontFamily.medium },
  /** Count bubbles, status pills — mono, uppercase. */
  badge: { ...roleMono, textTransform: 'uppercase' },

  // --- Legacy aliases ---
  display: { ...roleHeading, fontFamily: fontFamily.semibold },
  bodyLarge: { ...roleSmall, fontFamily: fontFamily.medium },
  /** Screen subtitle — the sentence under an `h1`/`eyebrow` block. */
  subtitle: { ...roleSmall, fontFamily: fontFamily.regular },
  /**
   * Deprecated alias of `bodySm` — identical values, kept so existing call
   * sites keep compiling. New code should use `bodySm`.
   */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
    letterSpacing: letterSpacing.small,
  },
  legal: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.mono,
    letterSpacing: letterSpacing.small,
  },
  link: { ...roleSmall, fontFamily: fontFamily.medium },
  button: { ...roleSmall, fontFamily: fontFamily.medium },
};

// `roleBody` / `roleHeadingLg` are part of the scale even when no variant uses
// them yet; exported so new screens can compose from the same trios.
export const typeRoles = {
  headingLg: roleHeadingLg,
  heading: roleHeading,
  subheading: roleSubheading,
  body: roleBody,
  small: roleSmall,
  mono: roleMono,
} as const;
