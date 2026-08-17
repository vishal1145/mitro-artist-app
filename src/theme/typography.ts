import type { TextStyle } from 'react-native';

import { rf } from '@utils/responsive';

/**
 * Typography tokens mirroring the Mitro Figma:
 *  - Plus Jakarta Sans  -> display / headings / buttons
 *  - Inter              -> body / captions / links
 *  - JetBrains Mono     -> labels + legal text (the monospace, tracked look)
 *
 * With custom fonts the weight is baked into the family name, so variants set
 * `fontFamily` rather than `fontWeight`. If fonts fail to load, RN falls back
 * to the system font and these still render (just without the custom face).
 */

export const fontFamily = {
  display: 'PlusJakartaSans_800ExtraBold',
  heading: 'PlusJakartaSans_700Bold',
  headingSemibold: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  xs: rf(12),
  sm: rf(14),
  md: rf(15),
  lg: rf(16),
  xl: rf(19),
  xxl: rf(23),
  xxxl: rf(30),
  display: rf(38),
} as const;

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyLarge'
  | 'caption'
  | 'label'
  | 'link'
  | 'button';

export const typography: Record<TypographyVariant, TextStyle> = {
  display: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.display,
    lineHeight: rf(42),
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxxl,
    lineHeight: rf(36),
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxl,
    lineHeight: rf(28),
  },
  h3: {
    fontFamily: fontFamily.headingSemibold,
    fontSize: fontSize.xl,
    lineHeight: rf(26),
  },
  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    lineHeight: rf(24),
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    lineHeight: rf(22),
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: rf(20),
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    lineHeight: rf(16),
    letterSpacing: 1,
  },
  link: {
    fontFamily: fontFamily.bodySemibold,
    fontSize: fontSize.md,
    lineHeight: rf(22),
  },
  button: {
    fontFamily: fontFamily.headingSemibold,
    fontSize: fontSize.xl,
    lineHeight: rf(24),
  },
};
