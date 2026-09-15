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
  ctaMuted: [
    withAlpha('#7C4DFF', 0.28),
    withAlpha(palette.pink, 0.28),
  ] as const,
  /** Profile ring — the full accent wheel. */
  ring: [
    palette.pink,
    palette.gold,
    palette.cyan,
    palette.violet,
    palette.pink,
  ] as const,
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

/* -------------------------------------------------------------------------- */
/*  4. Artist Web parity tokens                                               */
/* -------------------------------------------------------------------------- */

/**
 * Verbatim values from the Artist Web (`Mitro.Artist.UI/src/styles.css`).
 *
 * Screens replicated 1:1 from the web read from here instead of the app
 * palette above, so the copy keeps the web's exact colours (its greens/greys
 * are a few points off the app spec and approximating them shows). Do not use
 * these on screens that are NOT web replicas.
 */
export const webColors = {
  /** --text-strong */
  textStrong: '#FFFAFF',
  /** --text-soft */
  textSoft: 'rgba(255, 250, 255, 0.72)',

  green: '#42F5A7',
  gold: '#FFC86B',
  danger: '#FF5959',
  pinkLight: '#FF8FC7',
  pinkHot: '#FF3FAD',
  purple: '#8C4DFF',
  /** Foreground on the green CTA fill. */
  onGreen: '#0C1F14',

  /** Panel / side-card base fills (the gradient sits on top of these). */
  panelFill: 'rgba(12, 10, 25, 0.78)',
  sideCardFill: 'rgba(12, 10, 25, 0.7)',
  panelBorder: 'rgba(255, 255, 255, 0.13)',
  panelHeader: 'rgba(255, 255, 255, 0.055)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  circleBorder: 'rgba(255, 255, 255, 0.14)',
  hairline: 'rgba(255, 255, 255, 0.08)',

  inputFill: 'rgba(5, 4, 11, 0.55)',
  inputBorder: 'rgba(255, 255, 255, 0.16)',

  /** Neutral chip fill — also the skeleton block colour. */
  chip: 'rgba(255, 255, 255, 0.06)',
  chipText: 'rgba(255, 255, 255, 0.55)',
  offPill: 'rgba(255, 255, 255, 0.08)',
  offPillRing: 'rgba(255, 255, 255, 0.12)',

  greenBorder: 'rgba(66, 245, 167, 0.32)',
  greenChip: 'rgba(66, 245, 167, 0.16)',
  greenPill: 'rgba(66, 245, 167, 0.14)',
  greenRing: 'rgba(66, 245, 167, 0.35)',
  goldChip: 'rgba(255, 200, 107, 0.14)',
  goldTone: 'rgba(255, 200, 107, 0.16)',
  dangerTone: 'rgba(255, 89, 89, 0.15)',

  /** Plain white alphas the web uses directly on text. */
  white40: 'rgba(255, 255, 255, 0.4)',
  white45: 'rgba(255, 255, 255, 0.45)',
  white50: 'rgba(255, 255, 255, 0.5)',
} as const;

/** Multi-stop fills copied from the same stylesheet. All are CSS 135deg/145deg
 *  (top-left to bottom-right), i.e. `gradientDirection.diagonal`. */
export const webGradients = {
  /** .pcall-settings-card.is-on */
  settingsOn: ['rgba(66, 245, 167, 0.09)', 'rgba(255, 255, 255, 0.02)'],
  /** .bcast-price-card */
  settingsOff: ['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.02)'],
  /** .broadcast-users-panel */
  panel: ['rgba(255, 255, 255, 0.095)', 'rgba(255, 255, 255, 0.035)'],
  /** .gsched-side-card */
  sideCard: ['rgba(255, 255, 255, 0.075)', 'rgba(255, 255, 255, 0.02)'],
  /** .bcast-price-card-form button */
  greenCta: ['#42F5A7', '#6AA238'],
  /** .bcast-activity-avatar */
  avatar: ['#FF3FAD', '#8C4DFF'],
} as const;

/* -------------------------------------------------------------------------- */
/*  5. Call-room (Live Broadcast studio) visual language                      */
/* -------------------------------------------------------------------------- */

/**
 * The exact surface/border/ink values the Live Broadcast room ships, lifted
 * out of that screen so every call surface (Group Call, Private Call) renders
 * in the same language instead of re-picking colours.
 *
 * Verbatim from the broadcast studio — do not "improve" them; changing one
 * changes the studio look everywhere.
 */
export const callUi = {
  /** Round action-bar chips. */
  chip: {
    danger: { bg: 'rgba(255,92,122,0.16)', border: 'rgba(255,92,122,0.5)', icon: '#FF5C7A' },
    neutral: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.16)', icon: '#FFFFFF' },
    gift: { bg: '#6B2E46', border: '#8A3D5C', icon: '#FFFFFF' },
    stats: { bg: '#2E5A6B', border: '#3D768F', icon: '#FFFFFF' },
  },
  /** Active chip / START-style gradient. */
  activeGradient: ['#FF3FAD', '#8C4DFF'] as const,

  barSurface: 'rgba(255,255,255,0.05)',
  stageFill: '#090716',
  stageBorder: 'rgba(140,77,255,0.55)',
  stageDark: '#05040B',

  glassPill: 'rgba(0,0,0,0.66)',
  glassPillBorder: 'rgba(255,255,255,0.25)',
  headerPill: 'rgba(0,0,0,0.42)',
  subtleSurface: 'rgba(255,255,255,0.07)',
  hairline: 'rgba(255,255,255,0.07)',

  overlayBadge: 'rgba(5,4,11,0.68)',
  overlayBadgeBorder: 'rgba(255,255,255,0.16)',

  mutedBtnBg: 'rgba(239,68,68,0.14)',
  mutedBtnBorder: 'rgba(239,68,68,0.45)',
  mutedIcon: '#FF8A97',

  liveBadge: '#E8192C',
  white: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',

  /** Activity feed rows. */
  actDetail: 'rgba(255,250,255,0.72)',
  actName: '#FFFAFF',
  actNameGift: '#FF8FB3',
  tokenPill: 'rgba(255,200,107,0.14)',
  tokenPillInk: '#FFC86B',
} as const;

/** Activity-row status chips — same labels/colours as the broadcast feed. */
export const callStatusStyle: Record<string, { label: string; color: string; bg: string }> = {
  fulfilled: { label: 'DELIVERED', color: '#4ADE80', bg: 'rgba(74,222,128,0.16)' },
  pending: { label: 'PENDING', color: '#FFC86B', bg: 'rgba(255,200,107,0.16)' },
  refunded: { label: 'REFUNDED', color: '#94A3B8', bg: 'rgba(148,163,184,0.16)' },
  cancelled: { label: 'CANCELLED', color: '#F87171', bg: 'rgba(248,113,113,0.16)' },
};

export type ColorToken = keyof typeof colors;
export type GradientToken = keyof typeof gradients;
export type CtaGradientToken = keyof typeof gradientGlow;
