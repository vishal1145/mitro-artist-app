import Toast from 'react-native-toast-message';

export type ToastKind = 'success' | 'error' | 'info';

/**
 * Lightweight, non-blocking app toast for inline feedback — the toaster
 * replacement for Alert on success/error messages. Renders the shared
 * 'appNotification' card (see @components/shared/Toast); `kind` picks the icon.
 */
export const showToast = (message: string, kind: ToastKind = 'info', detail?: string): void => {
  Toast.show({
    type: 'appNotification',
    text1: message,
    text2: detail,
    props: { type: kind },
    position: 'top',
    visibilityTime: 3000,
  });
};

/* -------------------------------------------------------------------------- */
/*  Popup toast — Artist Web parity                                           */
/* -------------------------------------------------------------------------- */

/**
 * The mobile counterpart of the Artist Web's
 * `usePopup().showToast(message, type)`
 * (Mitro.Artist.UI/src/PopupContext.tsx + components/Toast.tsx).
 *
 * Why this sits beside `showToast` above rather than replacing it: the ~28
 * existing `showToast` call sites include the locked call rooms
 * (private-call-room, group-call-room, live-broadcast-room). Repointing that
 * helper would restyle their toasts, so the new card is registered as a second
 * variant on the SAME host and config instead — one toaster, two cards.
 *
 * Prefer this one for form / auth / API feedback; `showToast` stays the
 * notification-styled card.
 */

/** Same union as the web's `ToastType`. */
export type PopupToastType = 'success' | 'error' | 'warning' | 'alert' | 'info';

/** Web parity: the web Toast component's `duration = 3500`. */
export const POPUP_TOAST_DURATION_MS = 3500;

/** Config key registered in `toastConfig` (@components/shared/Toast). */
export const POPUP_TOAST_TYPE = 'popupToast';

export const showPopupToast = (message: string, type: PopupToastType = 'info'): void => {
  if (!message) {
    return;
  }

  Toast.show({
    type: POPUP_TOAST_TYPE,
    text1: message,
    props: { type },
    position: 'top',
    // The card reads the safe-area inset itself — see AppToast.tsx.
    topOffset: 0,
    visibilityTime: POPUP_TOAST_DURATION_MS,
    autoHide: true,
  });
};

/** Manual dismissal — the card's close button uses this too. */
export const hidePopupToast = (): void => {
  Toast.hide();
};
