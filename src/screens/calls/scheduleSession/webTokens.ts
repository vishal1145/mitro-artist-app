/**
 * Palette + geometry lifted verbatim from the artist web's `.gsched-*` /
 * `.gcall-mode-*` rules (Mitro.Artist.UI/src/styles.css) so this screen is the
 * mobile-responsive web page, not an approximation of it.
 */
export const web = {
  textStrong: '#FFFAFF',
  textSoft: 'rgba(255, 250, 255, 0.72)',
  hint: 'rgba(255, 255, 255, 0.4)',
  help: 'rgba(255, 255, 255, 0.35)',
  eyebrow: '#FF8FC7',
  backBg: 'rgba(255, 255, 255, 0.06)',
  backBorder: 'rgba(255, 255, 255, 0.14)',
  cardBase: 'rgba(12, 10, 25, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.13)',
  sideBase: 'rgba(12, 10, 25, 0.7)',
  inputBg: 'rgba(5, 4, 11, 0.6)',
  inputBorder: 'rgba(255, 255, 255, 0.14)',
  placeholder: 'rgba(255, 255, 255, 0.32)',
  modeIdleBg: 'rgba(255, 255, 255, 0.04)',
  modeIdleBorder: 'rgba(255, 255, 255, 0.12)',
  approvalBg: 'rgba(255, 255, 255, 0.03)',
  approvalBorder: 'rgba(255, 255, 255, 0.1)',
  switchTrack: 'rgba(255, 255, 255, 0.16)',
  checkIdleText: 'rgba(255, 255, 255, 0.45)',
  checkIdleIcon: 'rgba(255, 255, 255, 0.25)',
  green: '#42F5A7',
  gold: '#FFC86B',
  mathBorder: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000000',
  pinkGlow: 'rgba(255, 63, 173, 0.3)',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

/** linear-gradient(135deg, #ff3fad, #8c4dff) */
export const HOT_STOPS = ['#FF3FAD', '#8C4DFF'] as const;
/** linear-gradient(145deg, rgba(255,255,255,.095), rgba(255,255,255,.035)) */
export const CARD_SHEEN = ['rgba(255, 255, 255, 0.095)', 'rgba(255, 255, 255, 0.035)'] as const;
/** linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.02)) */
export const SIDE_SHEEN = ['rgba(255, 255, 255, 0.075)', 'rgba(255, 255, 255, 0.02)'] as const;

export const DIAG_START = { x: 0, y: 0 };
export const DIAG_END = { x: 1, y: 1 };
/** 145deg — steeper than the corner-to-corner diagonal. */
export const SHEEN_END = { x: 0.7, y: 1 };
