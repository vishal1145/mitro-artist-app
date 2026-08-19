/**
 * Color tokens — ported 1:1 from the shipped Mitro user app.
 * Never use raw hex/rgba in components; import from here.
 *
 * Layers:
 *   1. `palette`  — the exact spec values.
 *   2. `colors`   — role tokens. New spec names come first; the legacy names
 *                   below them are aliases kept so existing screens compile.
 *   3. `gradients`— multi-stop fills.
 *
 * Key notes from the design:
 *   - Cards are NEUTRAL dark grey, never purple-tinted.
 *   - Content screens are flat black; the glow appears on auth screens only.
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
/*  1. Palette — exact spec values                                            */
/* -------------------------------------------------------------------------- */

export const palette = {
  // Surfaces
  screen: '#050506',
  card: '#151517',
  cardRaised: '#1C1C1F',
  input: '#141416',
  heroIndigo: '#251E52',
  navPill: 'rgba(26, 24, 48, 0.92)',

  // Borders
  border: 'rgba(255, 255, 255, 0.07)',
  borderHot: 'rgba(255, 63, 173, 0.35)',
  borderGold: 'rgba(255, 200, 107, 0.35)',

  // Text
  textPrimary: '#F7F4FF',
  textSecondary: '#A99DC4',
  textMuted: '#6C6288',

  // Accents
  pink: '#FF3FAD',
  violet: '#7C4DFF',
  purple: '#8C4DFF',
  cyan: '#33E6FF',
  gold: '#FFC86B',
  green: '#35EEA3',
  red: '#FF5C7A',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/* -------------------------------------------------------------------------- */
/*  2. Role tokens                                                            */
/* -------------------------------------------------------------------------- */

export const colors = {
  // --- Surfaces (spec names) ---
  screen: palette.screen,
  card: palette.card,
  cardRaised: palette.cardRaised,
  input: palette.input,
  heroIndigo: palette.heroIndigo,
  navPill: palette.navPill,

  // --- Borders ---
  border: palette.border,
  borderHot: palette.borderHot,
  borderGold: palette.borderGold,

  // --- Text ---
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,

  // --- Accents ---
  pink: palette.pink,
  violet: palette.violet,
  purple: palette.purple,
  cyan: palette.cyan,
  gold: palette.gold,
  green: palette.green,
  red: palette.red,

  // Tinted accent fills — icon chips use 15%.
  pinkSoft: withAlpha(palette.pink, 0.15),
  violetSoft: withAlpha(palette.violet, 0.15),
  purpleSoft: withAlpha(palette.purple, 0.15),
  cyanSoft: withAlpha(palette.cyan, 0.15),
  goldSoft: withAlpha(palette.gold, 0.15),
  greenSoft: withAlpha(palette.green, 0.15),
  redSoft: withAlpha(palette.red, 0.15),

  /* ------------------------------------------------------------------------ */
  /*  Legacy aliases — keep existing screens compiling against the new palette */
  /* ------------------------------------------------------------------------ */

  background: palette.screen,
  surface: palette.card,
  surfaceRaised: palette.cardRaised,
  surfaceElevated: palette.cardRaised,

  primary: palette.pink,
  primaryDark: palette.violet,
  primaryPressed: palette.purple,
  primarySoft: withAlpha(palette.pink, 0.15),
  primaryChip: withAlpha(palette.pink, 0.2),
  primaryBorder: palette.borderHot,
  /** CTA label colour — the new CTA is white text on the gradient. */
  onPrimary: palette.white,
  onPrimaryContrast: palette.white,
  ctaDark: palette.white,
  accentPink: palette.pink,

  onSurface: palette.textPrimary,
  subtitle: palette.textSecondary,
  fieldLabel: palette.textMuted,
  textDisabled: palette.textMuted,

  inputBackground: palette.input,
  inputBorder: palette.border,
  inputBorderFocused: palette.pink,
  inputPlaceholder: palette.textMuted,

  success: palette.green,
  successBg: withAlpha(palette.green, 0.15),
  successSoft: withAlpha(palette.green, 0.12),
  successBorder: withAlpha(palette.green, 0.35),
  successChip: withAlpha(palette.green, 0.15),

  warning: palette.gold,
  warningBg: withAlpha(palette.gold, 0.15),
  warningSoft: withAlpha(palette.gold, 0.12),
  warningBorder: palette.borderGold,
  warningChip: withAlpha(palette.gold, 0.15),

  error: palette.red,
  errorBg: withAlpha(palette.red, 0.15),
  errorSoft: withAlpha(palette.red, 0.12),
  errorBorder: withAlpha(palette.red, 0.35),

  info: palette.cyan,
  infoSoft: withAlpha(palette.cyan, 0.12),
  infoBorder: withAlpha(palette.cyan, 0.35),

  /* ------------------------------------------------------------------------ */
  /*  Foreground on a SOLID accent fill                                       */
  /*                                                                          */
  /*  `successBg` and friends are 15% tints meant for backgrounds. Text or an */
  /*  icon painted with them on top of the matching solid fill is invisible —  */
  /*  use these instead.                                                       */
  /* ------------------------------------------------------------------------ */
  onSuccess: palette.screen,
  onWarning: palette.screen,
  onInfo: palette.screen,
  onError: palette.white,

  // --- Translucent, role-named ---
  scrim: withAlpha(palette.screen, 0.65),
  glassSurface: palette.navPill,
  glassBorder: palette.border,
  chipSurface: withAlpha(palette.screen, 0.55),
  chipSurfaceStrong: withAlpha(palette.black, 0.7),
  iconChip: withAlpha(palette.white, 0.06),
  overlayDim: withAlpha(palette.screen, 0.72),
  divider: palette.border,

  // --- Glow (shadowColor) ---
  ctaGlow: withAlpha(palette.pink, 0.35),
  focusGlow: withAlpha(palette.pink, 0.3),
  glow: palette.pink,

  // --- Utility ---
  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,
} as const;

/* -------------------------------------------------------------------------- */
/*  3. Gradients                                                              */
/* -------------------------------------------------------------------------- */

/** Linear-gradient stops. `cta` is 90deg; `avatar` is 135deg (see start/end). */
export const gradients = {
  /** Primary CTA — violet -> pink, left to right. */
  cta: [palette.violet, palette.pink] as const,
  /** Avatar fill — purple -> pink on the 135deg diagonal. */
  avatar: [palette.purple, palette.pink] as const,
  /** Disabled CTA — the same ramp at low opacity, so it reads as "not yet". */
  ctaMuted: [withAlpha(palette.violet, 0.28), withAlpha(palette.pink, 0.28)] as const,
  /** Profile ring — the full accent wheel. */
  ring: [palette.pink, palette.gold, palette.cyan, palette.violet, palette.pink] as const,

  // Legacy aliases.
  live: [palette.violet, palette.pink] as const,
  primary: [palette.violet, palette.pink] as const,
  forgot: [palette.violet, palette.pink] as const,
  brand: [palette.purple, palette.pink] as const,
  hero: [palette.heroIndigo, palette.heroIndigo] as const,
  scrim: [withAlpha(palette.screen, 0), palette.screen] as const,
  glassHighlight: [
    withAlpha(palette.pink, 0),
    withAlpha(palette.pink, 0.35),
    withAlpha(palette.pink, 0),
  ] as const,
} as const;

/** Gradient start/end points, so 90deg vs 135deg is expressed once. */
export const gradientDirection = {
  /** 90deg — left to right. */
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  /** 135deg — top-left to bottom-right. */
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
} as const;

/**
 * Auth-screen glow: two soft radials over the flat screen colour.
 * Content screens stay flat black — never apply this outside auth.
 */
export const authGlow = {
  base: palette.screen,
  orbs: [
    {
      color: withAlpha(palette.pink, 0.16),
      cx: '12%',
      cy: '2%',
      rx: '70%',
      ry: '45%',
    },
    {
      color: 'rgba(107, 45, 244, 0.20)',
      cx: '88%',
      cy: '4%',
      rx: '70%',
      ry: '45%',
    },
  ],
} as const;

/** Shadow colour beneath each gradient CTA. */
export const gradientGlow = {
  cta: colors.ctaGlow,
  live: colors.ctaGlow,
  primary: colors.ctaGlow,
  forgot: colors.ctaGlow,
} as const;

export type ColorToken = keyof typeof colors;
export type GradientToken = keyof typeof gradients;
export type CtaGradientToken = keyof typeof gradientGlow;
