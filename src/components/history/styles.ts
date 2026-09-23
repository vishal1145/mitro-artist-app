/**
 * Shared style tokens for the history presentation primitives.
 *
 * Every value here is lifted verbatim from the Artist Web stylesheet
 * (`src/styles.css`, the `.gcall-history-page` / `.bcast-history-page`
 * blocks) as it computes at phone widths, including the
 * `@media (max-width: 760px)` override that forces `.summary-strip` and
 * `.metric-grid` to two columns. Nothing is re-designed.
 */
import { StyleSheet } from 'react-native';

import { fontFamily, palette, webColors } from '@theme';
import { rf } from '@utils/responsive';

export const styles = StyleSheet.create({
  /* page-head ------------------------------------------------------------- */
  pageHeadH1: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    letterSpacing: -0.22,
    lineHeight: rf(27),
    marginBottom: 4,
  },
  pageHeadP: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(20),
  },

  /* filter-pills ---------------------------------------------------------- */
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillIdle: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillOn: {
    borderColor: palette.transparent,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillText: {
    color: webColors.white62,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },
  pillTextOn: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },

  /* info-callout ---------------------------------------------------------- */
  calloutCyan: {
    backgroundColor: webColors.cyanCallout,
    borderColor: webColors.cyanCalloutBorder,
    borderLeftColor: webColors.cyan,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  calloutGold: {
    backgroundColor: webColors.goldCallout,
    borderColor: webColors.goldCalloutBorder,
    borderLeftColor: webColors.gold,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  /** `.info-callout.pink` — same box, pink tint + left rule. */
  calloutPink: {
    backgroundColor: webColors.pinkCallout,
    borderColor: webColors.pinkCalloutBorder,
    borderLeftColor: webColors.pinkHot,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  /** `.info-callout.green` — unlike `.gold`/`.pink` it does NOT re-set
      `border-left-color`, so its `border-color` shorthand recolours all four
      sides; only the 3px left *width* survives from the base rule. */
  calloutGreen: {
    backgroundColor: webColors.greenCallout,
    borderColor: webColors.greenChipBorder,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  /** `.info-callout.red` — same shape as `.green`. */
  calloutRed: {
    backgroundColor: webColors.redCallout,
    borderColor: webColors.redCalloutBorder,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  calloutIcon: {
    marginTop: 1,
  },
  calloutBody: {
    flex: 1,
    minWidth: 0,
  },
  calloutText: {
    color: webColors.muted,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(20),
  },
  calloutStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
  },
  learnLink: {
    color: webColors.cyan,
    fontFamily: fontFamily.bold,
    fontSize: rf(12),
    lineHeight: rf(20),
    textDecorationLine: 'underline',
  },
  learnLinkGold: {
    color: webColors.gold,
    fontFamily: fontFamily.bold,
    fontSize: rf(12),
    lineHeight: rf(20),
    textDecorationLine: 'underline',
  },

  /* info-help-icon tooltip ------------------------------------------------ */
  /** Dimmed backdrop; the web has none, but a tap target needs somewhere to
      tap away to. */
  tooltipBackdrop: {
    alignItems: 'center',
    backgroundColor: webColors.scrim,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  /** `.info-help-icon::after` — #16142c on a 1px hairline, r8, 7/10 padding,
      capped at the web's 220px. */
  tooltip: {
    backgroundColor: webColors.tooltipFill,
    borderColor: webColors.tooltipBorder,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tooltipText: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(11.5),
    lineHeight: rf(16),
  },

  /* grids ----------------------------------------------------------------- */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  /* summary-strip --------------------------------------------------------- */
  summaryCell: {
    alignItems: 'center',
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryIc: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  /** `.label { display: inline-flex; align-items: center; gap: 4px }`. */
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    color: webColors.dim,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: rf(10.5),
    letterSpacing: 0.63,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(17.5),
    lineHeight: rf(22),
  },

  /* list-head ------------------------------------------------------------- */
  listHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  eyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: webColors.goldChip,
    borderColor: webColors.goldCalloutBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eyebrowText: {
    color: webColors.gold,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10.5),
    letterSpacing: 0.53,
    lineHeight: rf(14),
    textTransform: 'uppercase',
  },
  listHeading: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(16),
    lineHeight: rf(21),
    marginBottom: 12,
    marginTop: 6,
  },

  /* cards ----------------------------------------------------------------- */
  card: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardDetail: {
    borderTopColor: webColors.hairline06,
    borderTopWidth: 1,
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* metric grid ----------------------------------------------------------- */
  metricGrid: {
    paddingTop: 14,
  },
  metricChip: {
    backgroundColor: webColors.innerCard,
    borderColor: webColors.hairline06,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  /** `.metric-chip .label { gap: 4px; margin-bottom: 3px }`. */
  chipLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 3,
  },
  metricChipLabel: {
    color: webColors.dim,
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(10),
    letterSpacing: 0.5,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  metricChipValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(16),
    lineHeight: rf(21),
  },
  inkGood: {
    color: webColors.green,
  },
  inkWarn: {
    color: webColors.redInk,
  },

  metricTile: {
    backgroundColor: webColors.innerCard,
    borderColor: webColors.hairline06,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  metricTileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 7,
  },
  metricTileLabel: {
    color: webColors.dim,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(9.6),
    letterSpacing: 0.48,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  metricTileValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(17.5),
    lineHeight: rf(22),
    marginBottom: 6,
  },
  miniTrack: {
    backgroundColor: webColors.hairline06,
    borderRadius: 999,
    height: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  miniFill: {
    borderRadius: 999,
    height: '100%',
  },
  metricTileCaption: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(10),
    lineHeight: rf(14),
  },

  /* breakdown ------------------------------------------------------------- */
  bdRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  /** `.bd-row` column one — a fixed 90px track on the web. */
  bdNameCol: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    width: 90,
  },
  bdName: {
    color: webColors.muted,
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
  },
  bdTrack: {
    backgroundColor: webColors.hairline06,
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  bdFill: {
    borderRadius: 999,
    height: '100%',
  },
  bdAmt: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12),
    lineHeight: rf(16),
    textAlign: 'right',
    width: 60,
  },

  /* empty state ----------------------------------------------------------- */
  emptyState: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyText: {
    color: webColors.textSoft,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(20),
    textAlign: 'center',
  },
});
