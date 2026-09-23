import { StyleSheet } from 'react-native';

import { fontFamily, palette, webColors } from '@theme';
import { rf } from '@utils/responsive';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** `.creator-main { padding: 12px }` at ≤768px; `.tab-panel` gap 16. */
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },

  /* .page-head ------------------------------------------------------------ */
  pageHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  /** `.creator-settings-back` — 36px circle, shown only at ≤768px. */
  backBtn: {
    alignItems: 'center',
    backgroundColor: webColors.chip,
    borderColor: webColors.circleBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headText: {
    flex: 1,
  },
  h1: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    letterSpacing: -0.22,
    lineHeight: rf(27),
    marginBottom: 4,
  },
  headSub: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(19),
  },

  /* .tab-bar -------------------------------------------------------------- */
  tabBar: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  tabBtn: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  tabBtnActive: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  tabLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },
  tabLabelActive: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(16),
  },

  /* Section ---------------------------------------------------------------
   * Panel chrome intentionally removed: both settings groups sit flush on the
   * screen gutter (`content.paddingHorizontal: 12`) like every other screen,
   * with the 16px `content.gap` separating them. */
  section: {
    paddingTop: 4,
  },
  /**
   * The 3px the web used sat under a panel that supplied its own 20px of top
   * padding. With the outer box gone the heading landed almost on top of the
   * callout, so it carries the breathing room itself now — 12 here plus the
   * callout's own 2px top margin.
   */
  cardH3: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  /** `.creator-settings-page .info-callout { margin: 2px 0 16px }`. */
  cardCallout: {
    marginBottom: 16,
    marginTop: 2,
  },

  /* .reward-head-row / .reward-table / .reward-row ------------------------ */
  rewardHeadRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  headCellLeft: {
    color: webColors.dim,
    flex: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textTransform: 'uppercase',
  },
  headCellPrice: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'center',
    textTransform: 'uppercase',
    width: 90,
  },
  headCellStatus: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'center',
    textTransform: 'uppercase',
    width: 60,
  },
  headCellGap: {
    width: 24,
  },
  rewardTable: {
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  rewardRow: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rewardName: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  rewardPrice: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    textAlign: 'center',
    width: 90,
  },
  switchCell: {
    alignItems: 'center',
    width: 60,
  },
  rewardInput: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    padding: 0,
  },
  rewardPriceInput: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    padding: 0,
    textAlign: 'center',
    width: 90,
  },
  rewardRm: {
    alignItems: 'center',
    width: 24,
  },

  /* .btn-add / .btn-row / .btn-primary / .btn-ghost / .btn-danger --------- */
  btnAdd: {
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 10,
    width: '100%',
  },
  btnAddLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    /* Save/Cancel sit flush right, away from the left-aligned form above. */
    justifyContent: 'flex-end',
  },
  /** Rule closing off the reward menu before the fun wheel section starts. */
  sectionDivider: {
    backgroundColor: webColors.panelBorder,
    height: 1,
    marginBottom: 18,
    marginTop: 22,
  },
  btnPrimary: {
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnPrimaryLabel: {
    color: palette.white,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  btnGhost: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnGhostLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  btnDanger: {
    backgroundColor: webColors.dangerChip,
    borderColor: webColors.dangerChipBorder,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnDangerLabel: {
    color: webColors.dangerInk,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },

  /* .wheel-head / .wheel-visual / .wheel-title / .wheel-on-badge ---------- */
  wheelHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  /** 46px incl. the web's 3px ring; the SVG is the 40px inner disc. */
  wheelVisual: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 46,
  },
  wheelTitle: {
    flex: 1,
  },
  wheelName: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  wheelSub: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(11),
    lineHeight: rf(15),
  },
  wheelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.greenPill,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  wheelBadgeOff: {
    alignSelf: 'flex-start',
    backgroundColor: webColors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  wheelBadgeText: {
    color: webColors.green,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(13),
  },
  wheelBadgeTextOff: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(13),
  },

  /* .field / .field-input -------------------------------------------------- */
  field: {
    marginBottom: 12,
    marginTop: 12,
  },
  fieldLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
    marginBottom: 5,
  },
  fieldInput: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  fieldValue: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },

  /* .activity-list-head / .activity-row ----------------------------------- */
  activityHead: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  actHeadWeight: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'center',
    textTransform: 'uppercase',
    width: 52,
  },
  actHeadPct: {
    color: webColors.dim,
    fontFamily: fontFamily.bold,
    fontSize: rf(10),
    letterSpacing: 0.4,
    lineHeight: rf(13),
    textAlign: 'right',
    textTransform: 'uppercase',
    width: 44,
  },
  actHeadGap: {
    width: 20,
  },
  activityList: {
    gap: 7,
    marginBottom: 6,
  },
  activityRow: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  activityName: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
  },
  activityNameInput: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    padding: 0,
  },
  weightField: {
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 7,
    borderWidth: 1,
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    paddingHorizontal: 4,
    paddingVertical: 5,
    textAlign: 'center',
    width: 52,
  },
  weightInput: {
    backgroundColor: webColors.surfaceSoft,
    borderColor: webColors.panelBorder,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    width: 52,
  },
  weightValue: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(17),
    textAlign: 'center',
  },
  activityPct: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
    textAlign: 'right',
    width: 44,
  },
  activityRm: {
    alignItems: 'center',
    width: 20,
  },
  activityHint: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(10.5),
    lineHeight: rf(15),
    marginBottom: 10,
  },

  /* .popup-modal ----------------------------------------------------------- */
  /** `.popup-modal-overlay` — full-bleed `rgba(0,0,0,.7)`, centred.
   *  The web also blurs the backdrop (`backdrop-filter: blur(4px)`), which
   *  React Native has no equivalent for inside a plain Modal. */
  popupOverlay: {
    alignItems: 'center',
    backgroundColor: webColors.popupScrim,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  /** `.popup-modal { width: 90%; max-width: 400px; padding: 24px; r12 }`. */
  popupModal: {
    backgroundColor: webColors.popupFill,
    borderColor: webColors.popupBorder,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 400,
    padding: 24,
    width: '90%',
  },
  /** `.popup-modal h3 { margin-top: 0; margin-bottom: 12px; color: #fff }` —
   *  a bare `h3`, so browser default 1.17rem bold. */
  popupTitle: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(18.7),
    lineHeight: rf(25),
    marginBottom: 12,
  },
  /** `.popup-modal p { color: #aaa; margin-bottom: 24px; font-size: .95rem }`. */
  popupBody: {
    color: webColors.popupBodyInk,
    fontFamily: fontFamily.regular,
    fontSize: rf(15.2),
    lineHeight: rf(23.5),
    marginBottom: 24,
  },
  /** `.popup-modal-actions { justify-content: flex-end; gap: 12px }`. */
  popupActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  /** `.popup-btn-cancel` — transparent, `1px solid #ffffff20`, 8/16, r8. */
  popupCancel: {
    alignItems: 'center',
    borderColor: webColors.popupBorder,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  popupCancelLabel: {
    color: palette.white,
    fontFamily: fontFamily.regular,
    fontSize: rf(15.2),
    lineHeight: rf(20),
  },
  /** `.popup-btn-confirm` — 135° #ff4757 → #ff6b81, no border, 8/16, r8, bold. */
  popupConfirm: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  popupConfirmLabel: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontSize: rf(15.2),
    lineHeight: rf(20),
  },
});
