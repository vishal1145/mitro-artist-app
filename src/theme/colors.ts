/**
 * Color tokens — the exact values from DESIGN_SYSTEM.md, which mirrors the
 * shipped Mitro user app. Never use raw hex/rgba in components; import here.
 *
 * Layers:
 *   1. `palette`  — the spec values, verbatim.
 *   2. `colors`   — role tokens. Spec names first; the legacy names below them
 *                   are aliases kept so existing screens compile unchanged.
 *   3. `gradients`— multi-stop fills.
 *
 * Hard constraints from the spec:
 *   - Dark theme only. Background is #070614, never pure black.
 *   - Do not invent colors outside this palette.
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
/*  1. Palette — spec values, verbatim                                        */
/* -------------------------------------------------------------------------- */

export const palette = {
  // Surfaces
  background: '#070614',
  backgroundAlt: '#0D0C1F',
  surface: 'rgba(24, 21, 44, 0.92)',
  surfaceStrong: 'rgba(30, 26, 50, 0.98)',
  surfaceSoft: 'rgba(255, 255, 255, 0.06)',

  // Borders
  border: 'rgba(255, 255, 255, 0.09)',
  borderSoft: 'rgba(255, 255, 255, 0.05)',
  /** Focused / pressed state. */
  borderHot: 'rgba(255, 72, 181, 0.45)',

  // Text
  text: '#F7F4FF',
  textMuted: '#A99DC4',
  textDim: '#6C6288',

  // Accents
  pink: '#FF3FAD',
  purple: '#8C4DFF',
  violet: '#6B2DF4',
  cyan: '#33E6FF',
  gold: '#FFC86B',
  green: '#35EEA3',
  danger: '#FF5C7A',

  /** Debit / spend amounts. */
  spend: '#FF8A97',
  /** Credit / earn amounts. */
  earn: '#35EEA3',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/* -------------------------------------------------------------------------- */
/*  2. Role tokens                                                            */
/* -------------------------------------------------------------------------- */

export const colors = {
  // --- Surfaces (spec names) ---
  background: palette.background,
  backgroundAlt: palette.backgroundAlt,
  surface: palette.surface,
  surfaceStrong: palette.surfaceStrong,
  surfaceSoft: palette.surfaceSoft,

  // --- Borders ---
  border: palette.border,
  borderSoft: palette.borderSoft,
  borderHot: palette.borderHot,
  borderGold: withAlpha(palette.gold, 0.35),

  // --- Text ---
  text: palette.text,
  textMuted: palette.textDim,
  textDim: palette.textDim,

  // --- Accents ---
  pink: palette.pink,
  purple: palette.purple,
  violet: palette.violet,
  cyan: palette.cyan,
  gold: palette.gold,
  green: palette.green,
  danger: palette.danger,
  spend: palette.spend,
  earn: palette.earn,

  // Tinted accent fills — icon chips use 15%.
  pinkSoft: withAlpha(palette.pink, 0.15),
  violetSoft: withAlpha(palette.violet, 0.15),
  purpleSoft: withAlpha(palette.purple, 0.15),
  cyanSoft: withAlpha(palette.cyan, 0.15),
  goldSoft: withAlpha(palette.gold, 0.15),
  greenSoft: withAlpha(palette.green, 0.15),
  redSoft: withAlpha(palette.danger, 0.15),

  /* ------------------------------------------------------------------------ */
  /*  Legacy aliases — keep existing screens compiling against the new palette */
  /* ------------------------------------------------------------------------ */

  screen: palette.background,
  card: palette.surface,
  cardRaised: palette.surfaceStrong,
  input: palette.surface,
  heroIndigo: palette.backgroundAlt,
  /** Floating bottom nav fill. */
  navPill: 'rgba(22, 19, 40, 0.96)',

  textPrimary: palette.text,
  /** The spec calls this `textMuted`; kept under the app's existing name. */
  textSecondary: palette.textMuted,

  red: palette.danger,

  surfaceRaised: palette.surfaceStrong,
  surfaceElevated: palette.surfaceStrong,

  primary: palette.pink,
  primaryDark: palette.violet,
  primaryPressed: palette.purple,
  primarySoft: withAlpha(palette.pink, 0.15),
  primaryChip: withAlpha(palette.pink, 0.2),
  primaryBorder: palette.borderHot,
  /** CTA label colour — white on the brand gradient. */
  onPrimary: palette.white,
  onPrimaryContrast: palette.white,
  ctaDark: palette.white,
  accentPink: palette.pink,

  onSurface: palette.text,
  subtitle: palette.textMuted,
  fieldLabel: palette.textDim,
  textDisabled: palette.textDim,

  inputBackground: palette.surface,
  inputBorder: palette.border,
  inputBorderFocused: palette.pink,
  inputPlaceholder: palette.textDim,

  /* --- Foreground on a SOLID accent fill ---
     `successBg` and friends are 15% tints meant for backgrounds. Text or an
     icon painted with them on top of the matching solid fill is invisible —
     use these instead. */
  onSuccess: palette.background,
  onWarning: palette.background,
  onInfo: palette.background,
  onError: palette.white,

  success: palette.green,
  successBg: withAlpha(palette.green, 0.15),
  successSoft: withAlpha(palette.green, 0.12),
  successBorder: withAlpha(palette.green, 0.35),
  successChip: withAlpha(palette.green, 0.15),

  warning: palette.gold,
  warningBg: withAlpha(palette.gold, 0.15),
  warningSoft: withAlpha(palette.gold, 0.12),
  warningBorder: withAlpha(palette.gold, 0.35),
  warningChip: withAlpha(palette.gold, 0.15),

  error: palette.danger,
  errorBg: withAlpha(palette.danger, 0.15),
  errorSoft: withAlpha(palette.danger, 0.12),
  errorBorder: withAlpha(palette.danger, 0.35),

  info: palette.cyan,
  infoSoft: withAlpha(palette.cyan, 0.12),
  infoBorder: withAlpha(palette.cyan, 0.35),

  // --- Translucent, role-named ---
  scrim: withAlpha(palette.background, 0.65),
  glassSurface: 'rgba(22, 19, 40, 0.96)',
  glassBorder: palette.border,
  chipSurface: withAlpha(palette.background, 0.55),
  chipSurfaceStrong: withAlpha(palette.black, 0.7),
  iconChip: palette.surfaceSoft,
  overlayDim: withAlpha(palette.background, 0.72),
  /** Near-opaque backdrop for full-screen media, so nothing shows through. */
  overlayStrong: withAlpha(palette.background, 0.96),
  divider: palette.borderSoft,

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

export const gradients = {
  /** Primary CTAs, active pills, brand highlight rows. */
  brandWide: ['#7C4DFF', palette.pink, '#FF7AD1'] as const,
  /** Avatar fallback fill, small badges. */
  brand: [palette.pink, palette.violet] as const,
  /** Token / coin iconography. */
  gold: ['#FFE3A8', palette.gold, '#E09A2F'] as const,

  // Aliases onto the spec gradients.
  cta: ['#7C4DFF', palette.pink, '#FF7AD1'] as const,
  avatar: [palette.pink, palette.violet] as const,
  live: ['#7C4DFF', palette.pink, '#FF7AD1'] as const,
  primary: ['#7C4DFF', palette.pink, '#FF7AD1'] as const,
  forgot: ['#7C4DFF', palette.pink, '#FF7AD1'] as const,

  /** Disabled CTA — the brand ramp at low opacity. */
  ctaMuted: [withAlpha('#7C4DFF', 0.28), withAlpha(palette.pink, 0.28)] as const,
  /** Profile ring — the full accent wheel. */
  ring: [palette.pink, palette.gold, palette.cyan, palette.violet, palette.pink] as const,
  /** Dark card fill from the spec's card pattern. */
  card: ['#2C1C52', '#170F30'] as const,

  hero: [palette.backgroundAlt, palette.backgroundAlt] as const,
  scrim: [withAlpha(palette.background, 0), palette.background] as const,
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
 * Content screens stay flat — never apply this outside auth.
 */
export const authGlow = {
  base: palette.background,
  orbs: [
    {
      color: withAlpha(palette.pink, 0.16),
      cx: '12%',
      cy: '2%',
      rx: '70%',
      ry: '45%',
    },
    {
      color: withAlpha(palette.violet, 0.2),
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
  brandWide: colors.ctaGlow,
  live: colors.ctaGlow,
  primary: colors.ctaGlow,
  forgot: colors.ctaGlow,
} as const;

export type ColorToken = keyof typeof colors;
export type GradientToken = keyof typeof gradients;
export type CtaGradientToken = keyof typeof gradientGlow;
