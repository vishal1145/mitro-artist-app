import { StyleSheet } from 'react-native';

import { C } from './colors';
import { GALLERY_GAP } from './schema';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 16,
  },
  flex1: {
    flex: 1,
  },

  /* Page head */
  pageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: -0.24,
    color: C.text,
    marginBottom: 4,
  },
  subtitle: {
    color: C.dim,
    fontSize: 13,
  },

  /* Strength card */
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  priorityLeft: {
    flex: 1,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,200,107,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,107,0.3)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  eyebrowText: {
    color: C.gold,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priorityBig: {
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.22,
    color: C.text,
    marginTop: 10,
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepChipDone: {
    backgroundColor: 'rgba(66,245,167,0.12)',
    borderColor: 'rgba(66,245,167,0.35)',
  },
  stepChipTodo: {
    backgroundColor: 'rgba(255,200,107,0.12)',
    borderColor: 'rgba(255,200,107,0.35)',
  },

  /* Ring */
  ringWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumBig: {
    fontSize: 19,
    fontWeight: '700',
    color: C.text,
  },
  ringNumSmall: {
    fontSize: 9,
    letterSpacing: 0.36,
    color: C.dim,
    textTransform: 'uppercase',
  },

  /* Card */
  card: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    marginBottom: 16,
  },
  h2: {
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },

  /* Callout */
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 14,
  },
  calloutText: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 20,
  },
  calloutBold: {
    color: C.text,
    fontWeight: '700',
  },
  learnLink: {
    color: C.cyan,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* Field */
  field: {
    marginBottom: 14,
  },
  fieldRow2: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    marginBottom: 6,
    color: C.muted,
    fontSize: 11.5,
    fontWeight: '700',
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  fieldInputTop: {
    alignItems: 'flex-start',
  },
  iconTop: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 13,
    padding: 0,
  },
  textarea2: {
    minHeight: 48,
    textAlignVertical: 'top',
  },
  textarea3: {
    minHeight: 72,
    textAlignVertical: 'top',
  },

  /* Category picker modal */
  pickerScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: C.bg2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  pickerTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pickerRowText: {
    color: C.text,
    fontSize: 14,
  },

  /* Avatar row */
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarBigImg: {
    width: 60,
    height: 60,
  },
  avatarBigText: {
    fontWeight: '900',
    fontSize: 20,
    color: '#fff',
  },
  btnFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  btnFileText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Buttons */
  saveBarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnGhostSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
  },
  btnGhostSmText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  btnPrimarySm: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnPrimarySmFill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
    // Without an explicit lineHeight, Android sizes this from the font's own
    // metrics and then the rounded, overflow:hidden parent clips the result —
    // which is why the descender in "Save Profile" looked chopped off.
    lineHeight: 18,
  },

  /* Change password */
  pwToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pwToggleText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  pwBody: {
    marginTop: 10,
  },
  passRules: {
    marginBottom: 14,
    gap: 6,
  },
  passRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passRuleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  pwActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },

  /* Photo gallery */
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GALLERY_GAP,
    /* Without this a wrapped row stretches its items to the line's height,
       which is what let the last row's lone tile lose its square. */
    alignItems: 'flex-start',
  },
  /**
   * The percentage + ratio here are only the pre-measure fallback for the
   * first frame; `tileSize` replaces both with exact pixels (see the state
   * above) as soon as the grid reports its width.
   */
  galleryTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  galleryRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryAdd: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  galleryAddText: {
    color: C.dim,
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Save bar */
  saveBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  /* Both buttons get a 44pt floor — the accessible touch target, and enough
     room that the label can never be trimmed by the rounded clip. */
  btnGhost: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
  },
  btnGhostText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  btnPrimary: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnPrimaryFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },

  /* Public preview */
  previewHint: {
    color: C.dim,
    fontSize: 12,
    marginTop: -6,
    marginBottom: 12,
  },
  previewMedia: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  previewMediaImg: {
    ...StyleSheet.absoluteFillObject,
  },
  previewBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
    zIndex: 1,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.muted,
  },
  micGlow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,63,173,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  previewAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewAvatarImg: {
    width: 46,
    height: 46,
  },
  previewAvatarText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#fff',
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  previewName: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  previewSub: {
    color: C.dim,
    fontSize: 11.5,
    marginTop: 2,
  },
  previewBio: {
    color: C.muted,
    fontSize: 12.5,
    lineHeight: 18,
    minHeight: 34,
    marginBottom: 6,
  },
  previewSection: {
    marginTop: 12,
  },
  previewSectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  previewSectionLabelText: {
    color: C.dim,
    fontSize: 10.4,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  previewAbout: {
    color: C.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  chipPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(140,77,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(140,77,255,0.3)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  chipText: {
    color: C.chipPurpleText,
    fontSize: 10.5,
    fontWeight: '700',
  },
  previewStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  previewStat: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 9,
    alignItems: 'center',
    backgroundColor: C.surfaceStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  previewStatBig: {
    color: C.text,
    fontSize: 13,
    fontWeight: '800',
  },
  previewStatSmall: {
    color: C.dim,
    fontSize: 9.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  previewGalleryStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  previewStripImg: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
});
