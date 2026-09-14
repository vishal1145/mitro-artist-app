import { callUi } from '@theme';

/**
 * The live/call room palette.
 *
 * `callUi` in @theme is the source of truth (lifted verbatim out of the Live
 * Broadcast studio). This re-exports it as `live` and adds the few feed-only
 * inks it does not cover, so every room surface — broadcast, group call,
 * private call — paints from one object.
 */
export const live = {
  ...callUi,

  /** Aliases kept so either vocabulary resolves. */
  stageBg: callUi.stageFill,
  overlayPill: callUi.glassPill,
  overlayPillBorder: callUi.glassPillBorder,
  barFill: callUi.barSurface,
  mutedBg: callUi.mutedBtnBg,
  mutedBorder: callUi.mutedBtnBorder,
  feedName: callUi.actName,
  feedNameAccent: callUi.actNameGift,
  feedDetail: callUi.actDetail,
  highlight: callUi.tokenPillInk,
  tokenPillBg: callUi.tokenPill,

  /** The OFFLINE start gate. */
  gateEyebrow: '#FFB7DF',
  offlineDot: 'rgba(255,255,255,0.4)',
  progressTrack: 'rgba(255,255,255,0.12)',
  panelBorder: 'rgba(255,255,255,0.1)',
  panelFill: 'rgba(255,255,255,0.03)',

  /** Feed-only, not in callUi. */
  highlightRow: 'rgba(255,200,107,0.1)',
  highlightText: '#FFD68A',
  host: '#7C5CFF',
  hostBg: 'rgba(124,92,255,0.16)',
} as const;
