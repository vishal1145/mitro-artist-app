/**
 * Color tokens — single source of truth for every color in the app.
 * Never use raw hex/rgba strings in components; import from here.
 *
 * Layers:
 *   1. `palette`     — the raw brand/base ramp. Matches the design spec 1:1.
 *   2. `colors`      — role tokens (what a color is *for*, not what it looks like).
 *   3. `gradients`   — multi-stop fills.
 *
 * Translucent tokens are derived from the palette via `withAlpha()` rather than
 * hand-written rgba, so a palette change propagates everywhere automatically.
 */

/** Convert a #rrggbb hex + alpha (0..1) into an rgba() string. */
const withAlpha = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* -------------------------------------------------------------------------- */
/*  1. Palette — canonical spec values                                        */
/* -------------------------------------------------------------------------- */

export const palette = {
  // Surfaces
  bg: '#141122',
  surface: '#1c192b',
  surfaceRaised: '#201d2f',
  surfaceHigh: '#2b283a',
  border: '#363245',

  // Text
  textPrimary: '#e6dff8',
  textSecondary: '#cfc2d6',
  textMuted: '#988d9f',

  // Brand
  primary: '#ddb7ff',
  onPrimary: '#490080',
  primaryContainer: '#b76dff',

  // Status
  success: '#4edea3',
  onSuccess: '#003824',
  warning: '#ffb95f',
  onWarning: '#472a00',
  error: '#ffb4ab',
  onError: '#690005',

  // Accent
  accentPink: '#ec4899',

  /* --- Extended: not in the core spec, but required by existing UI --------- */
  /** Deep violet — pressed state + the "Create Account" gradient end stop. */
  violet: '#842bd2',
  /** Informational blue — used by the neutral/info callout tone. */
  info: '#82b1ff',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

/* -------------------------------------------------------------------------- */
/*  2. Role tokens                                                            */
/* -------------------------------------------------------------------------- */

export const colors = {
  // --- Brand ---
  primary: palette.primary,
  primaryDark: palette.primaryContainer,
  primaryPressed: palette.violet,
  /** Text/icon color on top of a light lavender surface. */
  onPrimary: palette.onPrimary,
  onPrimaryContrast: palette.onPrimary,
  /** Dark ink on the bright pink/violet CTA gradient. */
  ctaDark: palette.onPrimary,
  accentPink: palette.accentPink,

  // --- Surfaces ---
  background: palette.bg,
  surface: palette.surface,
  surfaceElevated: palette.surfaceHigh,
  /** Raised panel inside a card (list rows, inset blocks). */
  surfaceRaised: palette.surfaceRaised,
  border: palette.border,

  // --- Text ---
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  textDisabled: palette.surfaceHigh,
  onSurface: palette.textPrimary,
  /** Auth-screen subhead. */
  subtitle: palette.textSecondary,
  /** Small mono field labels. */
  fieldLabel: palette.textMuted,

  // --- Inputs ---
  inputBackground: palette.bg,
  inputBorder: palette.border,
  inputBorderFocused: palette.primary,
  inputPlaceholder: palette.textMuted,

  // --- Status ---
  success: palette.success,
  successBg: palette.onSuccess,
  warning: palette.warning,
  warningBg: palette.onWarning,
  error: palette.error,
  errorBg: palette.onError,
  info: palette.info,

  // --- Translucent, role-named ---
  /** Fade behind chat feeds layered over live video. */
  scrim: withAlpha(palette.bg, 0.65),
  /** Top bars and floating overlays. Pair with blur intensity 12. */
  glassSurface: withAlpha(palette.surfaceRaised, 0.6),
  glassBorder: withAlpha(palette.textPrimary, 0.1),
  /** Translucent pill sitting over video (e.g. "Mic on", duration badge). */
  chipSurface: withAlpha(palette.bg, 0.55),
  /** Higher-contrast pill for use over bright imagery. */
  chipSurfaceStrong: withAlpha(palette.black, 0.7),
  /** Subtle icon-chip fill on an opaque card. */
  iconChip: withAlpha(palette.textPrimary, 0.05),
  /** Full-screen dim behind modals and sheets. */
  overlayDim: withAlpha(palette.bg, 0.72),
  /** Hairline rule (dividers, "OR CONNECT"). */
  divider: withAlpha(palette.textPrimary, 0.1),

  /** Soft lavender wash — selected pills, primary icon chips. */
  primarySoft: withAlpha(palette.primary, 0.14),

  // Tinted callout fills + borders, one pair per status tone.
  successSoft: withAlpha(palette.success, 0.06),
  successBorder: withAlpha(palette.success, 0.35),
  warningSoft: withAlpha(palette.warning, 0.08),
  warningBorder: withAlpha(palette.warning, 0.2),
  warningChip: withAlpha(palette.warning, 0.12),
  successChip: withAlpha(palette.success, 0.12),
  primaryChip: withAlpha(palette.primary, 0.2),
  errorSoft: withAlpha(palette.error, 0.08),
  errorBorder: withAlpha(palette.error, 0.3),
  infoSoft: withAlpha(palette.info, 0.06),
  infoBorder: withAlpha(palette.info, 0.3),
  primaryBorder: withAlpha(palette.primary, 0.2),

  // --- Glow (shadowColor for CTAs and focus states) ---
  /** Shadow beneath the primary pink CTA. */
  ctaGlow: withAlpha(palette.accentPink, 0.35),
  /** Shadow for focused/active lavender elements. */
  focusGlow: withAlpha(palette.primary, 0.3),
  glow: palette.primary,

  // --- Utility ---
  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,
} as const;

/* -------------------------------------------------------------------------- */
/*  3. Gradients                                                              */
/* -------------------------------------------------------------------------- */

/** Linear-gradient stops (left -> right, i.e. 90deg). */
export const gradients = {
  /** Primary CTA — "Go Live" / "Start Live Broadcast". */
  cta: [palette.accentPink, palette.primaryContainer] as const,
  /** Alias kept for the login CTA call site. */
  live: [palette.accentPink, palette.primaryContainer] as const,
  /** Secondary CTA — "Create Account" / "Schedule Session". */
  primary: [palette.primaryContainer, palette.violet] as const,
  /** "Send Reset Link" (dark text on light lavender). */
  forgot: [palette.primary, palette.primaryContainer] as const,
  /** Logo mark. */
  brand: [palette.primaryContainer, palette.violet] as const,
  /** Large stat/hero panel wash. */
  hero: [withAlpha(palette.violet, 0.55), withAlpha(palette.bg, 0.9)] as const,
  /** Transparent -> bg fade for chat feeds over video. */
  scrim: [withAlpha(palette.bg, 0), palette.bg] as const,
  /** 1px top highlight on frosted glass cards. */
  glassHighlight: [
    withAlpha(palette.primary, 0),
    withAlpha(palette.primary, 0.35),
    withAlpha(palette.primary, 0),
  ] as const,
} as const;

/** Shadow color used for the soft glow beneath each gradient CTA. */
export const gradientGlow = {
  cta: colors.ctaGlow,
  live: colors.ctaGlow,
  primary: colors.focusGlow,
  forgot: colors.focusGlow,
} as const;

export type ColorToken = keyof typeof colors;
export type GradientToken = keyof typeof gradients;
/**
 * Gradients valid on a CTA button — exactly those with a matching glow.
 * Decorative fills (brand, hero, scrim, glassHighlight) are excluded.
 */
export type CtaGradientToken = keyof typeof gradientGlow;
