import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNToast, { type ToastConfigParams } from 'react-native-toast-message';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { rf } from '@utils/responsive';
import type { PopupToastType } from '@utils/toast';

/**
 * The app's inline-feedback toast — the counterpart of the Artist Web's
 * `.popup-toast` (Mitro.Artist.UI/src/components/Toast.tsx + styles.css).
 *
 * What is taken from the web, verbatim:
 *   - the tone union (success | error | warning | alert | info)
 *   - one icon per tone (lucide -> the matching Feather glyph)
 *   - a close button that dismisses immediately
 *   - 3500ms auto-dismiss (owned by `showPopupToast`)
 *
 * What is deliberately NOT taken: the web pins a 380px solid-gradient chip to
 * the top-RIGHT of a desktop viewport. On a phone that reads as a truncated
 * banner, so the card here is the mobile treatment — full-bleed under the
 * status bar, tinted fill behind a 1px tone border, text in the tone colour.
 *
 * Distinct from the `appNotification` card in ./index.tsx, which renders
 * push/hub notifications (avatar-style icon chip, title + body, tappable).
 * Both are registered on the SAME host, so there is still one toaster.
 */

interface ToneVisual {
  icon: keyof typeof Feather.glyphMap;
  /** Icon + text colour. */
  tint: string;
  /** Translucent tone wash laid over the opaque base. */
  fill: string;
  border: string;
}

/** Web `TOAST_ICON` mapped onto Feather, with the app's tone tokens. */
const TONE: Record<PopupToastType, ToneVisual> = {
  // CheckCircle2
  success: {
    icon: 'check-circle',
    tint: colors.success,
    fill: colors.successBg,
    border: colors.successBorder,
  },
  // XCircle
  error: {
    icon: 'x-circle',
    tint: colors.error,
    fill: colors.errorBg,
    border: colors.errorBorder,
  },
  // AlertTriangle
  warning: {
    icon: 'alert-triangle',
    tint: colors.warning,
    fill: colors.warningBg,
    border: colors.warningBorder,
  },
  // AlertOctagon
  alert: {
    icon: 'alert-octagon',
    tint: colors.pink,
    fill: colors.pinkSoft,
    border: colors.borderHot,
  },
  // Info
  info: {
    icon: 'info',
    tint: colors.info,
    fill: colors.infoSoft,
    border: colors.infoBorder,
  },
};

const PopupToast = ({
  text1,
  props,
}: ToastConfigParams<{ type?: PopupToastType }>) => {
  const insets = useSafeAreaInsets();
  const tone = TONE[props?.type ?? 'info'];

  return (
    // The host places the wrapper flush with the top (topOffset: 0) so the
    // inset can be read here — a fixed offset sits too low on notched phones
    // and clips under the status bar on ones with none.
    <View style={[styles.wrap, { marginTop: insets.top + spacing.xs }]}>
      <View
        style={[styles.card, { borderColor: tone.border }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {/* The tone wash is a separate layer so the card stays opaque —
            a translucent fill alone would let the screen bleed through. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.tint,
            { backgroundColor: tone.fill },
          ]}
        />

        <Feather name={tone.icon} size={rf(16)} color={tone.tint} />

        <Text variant="bodySm" style={[styles.message, { color: tone.tint }]}>
          {text1}
        </Text>

        <Pressable
          onPress={() => RNToast.hide()}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Feather name="x" size={rf(14)} color={tone.tint} />
        </Pressable>
      </View>
    </View>
  );
};

export default PopupToast;

const styles = StyleSheet.create({
  wrap: {
    width: '94%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    // Opaque base; `tint` washes the tone over it.
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
    // Web parity: box-shadow 0 8px 24px rgba(0,0,0,0.35).
    elevation: 6,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  tint: {
    borderRadius: radius.sm,
  },
  message: {
    flex: 1,
  },
});
