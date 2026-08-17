/**
 * Color tokens — single source of truth for every color in the app.
 * Values mirror the Mitro Figma (Material 3 dark scheme).
 * Never use raw hex strings in components; import from here.
 */
export const palette = {
  // Brand (lavender / violet)
  lavender: '#DDB7FF', // primary
  lavenderContainer: '#B76DFF', // primary-container
  violet: '#842BD2', // inverse-primary
  onPrimaryDark: '#490080', // on-primary (text on light lavender)

  // Neutrals (M3 dark)
  background: '#141122', // background / surface / surface-dim
  containerLowest: '#0F0C1D',
  containerLow: '#1C192B',
  container: '#201D2F',
  containerHigh: '#2B283A',
  containerHighest: '#363245',
  onSurface: '#E6DFF8',
  onSurfaceVariant: '#CFC2D6',
  outline: '#988D9F',
  outlineVariant: '#4D4354',
  white: '#FFFFFF',
  black: '#000000',

  // Semantic
  success: '#4EDEA3',
  successBg: '#00311F',
  error: '#FFB4AB',
  errorBg: '#93000A',
  warning: '#FFB95F',
  warningBg: '#3E2400',
  info: '#82B1FF',

  transparent: 'transparent',
} as const;

export const colors = {
  primary: palette.lavender,
  primaryDark: palette.lavenderContainer,
  primaryPressed: palette.violet,
  primarySoft: 'rgba(221, 183, 255, 0.14)',
  onPrimary: palette.white, // text on the bright login/register gradients
  onPrimaryContrast: palette.onPrimaryDark, // text on the light lavender button

  background: palette.background,
  surface: palette.container, // cards / social buttons
  surfaceElevated: palette.containerHigh, // icon circles, secondary button
  border: palette.containerHighest,
  overlay: 'rgba(14, 11, 26, 0.72)',

  textPrimary: palette.onSurface,
  textSecondary: palette.onSurfaceVariant,
  textMuted: palette.outline,
  textDisabled: palette.outlineVariant,
  onSurface: palette.onSurface,

  inputBackground: palette.containerLow,
  inputBorder: palette.containerHighest,
  inputBorderFocused: palette.lavender,
  inputPlaceholder: '#726B80',

  success: palette.success,
  successBg: palette.successBg,
  error: palette.error,
  errorBg: palette.errorBg,
  warning: palette.warning,
  warningBg: palette.warningBg,
  info: palette.info,

  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,

  // Glow behind gradient CTAs.
  glow: palette.lavender,
} as const;

/** Linear-gradient stops (left -> right) for CTAs and brand marks. */
export const gradients = {
  live: ['#FF6B9E', '#9B4DFF'] as const, // login "Go Live"
  primary: ['#B76DFF', '#842BD2'] as const, // register "Create Account"
  forgot: ['#DDB7FF', '#B76DFF'] as const, // forgot "Send Reset Link" (dark text)
  brand: ['#DDB7FF', '#842BD2'] as const, // logo mark
} as const;

export type ColorToken = keyof typeof colors;
export type GradientToken = keyof typeof gradients;
