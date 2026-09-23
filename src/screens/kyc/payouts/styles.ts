import { StyleSheet } from 'react-native';

import { fontFamily, webColors } from '@theme';
import { rf } from '@utils/responsive';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** `.creator-main { padding: 12px }` at ≤768px; `.creator-view { gap: 20px }`. */
  content: {
    gap: 20,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  /** `.tab-panel { display: flex; flex-direction: column; gap: 16px }`, and
   *  `KycSettingsTab`'s own root is `flex column; gap: 16` too. */
  panel: {
    gap: 16,
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
  },

  /* .priority-card (no box styling on this page) -------------------------- */
  /** `.eyebrow { margin-bottom: 12px }`. */
  eyebrow: {
    marginBottom: 12,
  },
  /** `p.big` is unstyled here, so it is a plain paragraph: inherited 16px,
   *  `line-height: 1.55`, default `margin-bottom: 1em`. */
  big: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(16),
    lineHeight: rf(24.8),
    marginBottom: 16,
  },

  /* .kyc-stepper ---------------------------------------------------------- */
  /** One row, never wrapped — see the `Stepper` note above. */
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  /** `minWidth: 0` is what lets the label inside actually shrink. */
  stepperRun: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    minWidth: 0,
  },
  step: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 7,
    minWidth: 0,
  },
  /** 26 rather than web's 30: four dots plus four labels have to fit a phone. */
  dot: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 13,
    borderWidth: 2,
    flexShrink: 0,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  dotDone: {
    backgroundColor: webColors.green,
    borderColor: webColors.green,
  },
  dotCurrent: {
    backgroundColor: webColors.gold,
    borderColor: webColors.gold,
  },
  dotNum: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12),
    lineHeight: rf(15),
  },
  dotNumCurrent: {
    color: webColors.onGoldDeep,
  },
  /** The only elastic part of the row: it gives width back to the connectors. */
  stepLbl: {
    color: webColors.muted,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
  },
  stepLblDone: {
    color: webColors.green,
  },
  stepLblCurrent: {
    color: webColors.gold,
  },
  /**
   * `.kyc-line { width: 34px; height: 2px; margin: 0 8px }` — shortened to 14
   * with 5px margins, because at web's 34+16 the three connectors alone eat
   * 150px of a ~330px row and there is nothing left for the labels.
   */
  line: {
    backgroundColor: webColors.panelBorder,
    flexShrink: 0,
    height: 2,
    marginHorizontal: 5,
    width: 14,
  },
  lineDone: {
    backgroundColor: webColors.green,
  },

  /** `.info-callout p + p { margin-top: 6px }`. */
  calloutSecondPara: {
    marginTop: 6,
  },

  /* .acc-item -------------------------------------------------------------- */
  accItem: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  accHeadTitle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  accTitle: {
    color: webColors.textStrong,
    flexShrink: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  accChip: {
    backgroundColor: webColors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  accChipDone: {
    backgroundColor: webColors.greenPill,
  },
  accChipText: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(13),
  },
  accChipTextDone: {
    color: webColors.green,
  },
  accBodyInner: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  /** `.creator-settings-page .info-callout { margin: 2px 0 16px }`. */
  bodyCallout: {
    marginBottom: 16,
    marginTop: 2,
  },

  /* .field ----------------------------------------------------------------- */
  field: {
    marginBottom: 12,
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
  /** `disabled` inputs on the web dim to 0.7 opacity. */
  fieldInputDisabled: {
    opacity: 0.7,
  },
  fieldValue: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(19),
  },
  /** Strip the platform's default TextInput chrome so it sits like the web's
   *  bare `<input>` inside the shared `.field-input` box. */
  fieldInputText: {
    padding: 0,
  },
  fieldPlaceholder: {
    color: webColors.placeholderInk,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(19),
  },
  /** `.field-row2 { grid-template-columns: 1fr 1fr; gap: 10px }` — no mobile
   *  override on the web, so the pair stays side by side here too. */
  fieldRow2: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldCol: {
    flex: 1,
    minWidth: 0,
  },
  /** Inline `style={{ maxWidth: 260 }}` on the web. */
  accountTypeField: {
    maxWidth: 260,
  },

  /* Account-type picker modal (matches edit-profile's picker) ------------- */
  pickerScrim: {
    backgroundColor: webColors.scrim,
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: webColors.innerCard,
    borderColor: webColors.panelBorder,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pickerTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(15),
    marginBottom: 12,
  },
  pickerRow: {
    alignItems: 'center',
    borderBottomColor: webColors.panelBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  pickerRowText: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(14),
  },
  pickerRowTextActive: {
    color: webColors.purple,
    fontFamily: fontFamily.bold,
  },

  /* .upload-field ---------------------------------------------------------- */
  uploadField: {
    marginBottom: 10,
  },
  uploadRow: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  uploadMeta: {
    flex: 1,
    minWidth: 0,
  },
  uploadStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(19),
  },
  uploadSmall: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(10.5),
    lineHeight: rf(16),
  },
  btnUpload: {
    alignItems: 'center',
    backgroundColor: webColors.uploadFill,
    borderColor: webColors.uploadBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnUploadDone: {
    backgroundColor: webColors.greenPill,
    borderColor: webColors.greenChipBorder,
  },
  btnUploadDisabled: {
    opacity: 0.6,
  },
  btnUploadText: {
    color: webColors.uploadInk,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(15),
  },
  btnUploadTextDone: {
    color: webColors.green,
  },

  /* .upload-thumb-row / .upload-thumb-sm / .upload-thumb-remove ----------- */
  uploadThumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
    marginTop: 8,
  },
  uploadThumb: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    height: 75,
    overflow: 'hidden',
    width: 75,
  },
  uploadThumbImg: {
    height: '100%',
    width: '100%',
  },
  uploadThumbRemove: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 3,
    top: 3,
    width: 18,
  },

  /* .kyc-missing-reasons -------------------------------------------------- */
  missingReasons: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  missingTitle: {
    color: '#EF4444',
    fontFamily: fontFamily.extrabold,
    fontSize: rf(13),
    lineHeight: rf(18),
    marginBottom: 8,
  },
  missingItem: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 3,
  },
  missingBullet: {
    color: '#FCA5A5',
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(18),
  },
  missingText: {
    color: '#FCA5A5',
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(18),
  },

  /* .kyc-submit ----------------------------------------------------------- */
  submit: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitFill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 15,
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
});
