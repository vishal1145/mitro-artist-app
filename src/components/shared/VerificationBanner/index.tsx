import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import type { VerificationBannerCopy } from '@hooks/useVerificationGate';
import { colors, fontFamily, typography, webColors } from '@theme';
import { rf } from '@utils/responsive';

/**
 * `.creator-main .verify-banner` — the KYC / approval strip web renders above
 * the topbar, and only ever while the dashboard is the active screen.
 *
 * Copy and tone come from `useVerificationGate().banner`; this file is only
 * the chrome. Measurements are web's: 13/15 padding, 12 gap, radius 12, a 3px
 * left rule and a 1px ring in the tone's colour.
 */

export interface VerificationBannerProps {
  banner: VerificationBannerCopy;
  onPressAction: () => void;
}

const TONE = {
  warn: {
    bg: webColors.verifyWarnBg,
    border: webColors.verifyWarnBorder,
    rule: webColors.verifyWarn,
  },
  danger: {
    bg: webColors.verifyDangerBg,
    border: webColors.verifyDangerBorder,
    rule: webColors.verifyDanger,
  },
  info: {
    bg: webColors.cyanCallout,
    border: webColors.cyanCalloutBorder,
    rule: colors.cyan,
  },
} as const;

const VerificationBannerComponent = ({
  banner,
  onPressAction,
}: VerificationBannerProps) => {
  const tone = TONE[banner.tone];

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          borderLeftColor: tone.rule,
        },
      ]}
    >
      <View style={styles.row}>
        {/* `> svg` takes the left rule's colour in every tone. */}
        <LucideIcon name="alert-triangle" size={rf(17)} color={tone.rule} />

        <View style={styles.copy}>
          <Text style={styles.headline}>{banner.headline}</Text>
          <Text style={styles.body}>{banner.body}</Text>
        </View>
      </View>

      {banner.showButton ? (
        <Pressable
          onPress={onPressAction}
          style={styles.btn}
          accessibilityRole="button"
          accessibilityLabel="Complete Verification"
        >
          <LucideIcon
            name="shield-check"
            size={rf(15)}
            color={webColors.verifyWarnInk}
          />
          <Text style={styles.btnLabel}>Complete Verification</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export const VerificationBanner = memo(VerificationBannerComponent);

const styles = StyleSheet.create({
  /**
   * A column, where web's is a row: web has a wide `.creator-main`, but at
   * phone width the button has nowhere to sit beside two lines of copy, so it
   * gets its own full-width line underneath.
   *
   * It used to be a wrapping row with `alignSelf: 'stretch'` on the button —
   * but the button never actually wrapped, so "stretch" sized it to the whole
   * paragraph's height and it rendered as a tall yellow slab.
   */
  banner: {
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 12,
  },
  /** Icon + copy, with the icon on the first line of the headline. */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  copy: { flex: 1, minWidth: 0 },
  headline: {
    // 0.82rem / 700 — a shade under bodyLg, so it isn't taken from typography.
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    lineHeight: rf(17),
    color: colors.textPrimary,
  },
  body: {
    ...typography.bodySm,
    marginTop: 3,
    lineHeight: rf(18),
    color: colors.textSecondary,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // Full width on its own line — a 14px-padded pill floating left of a wide
    // empty gap reads as unfinished. Height comes from the padding, not from
    // the copy beside it.
    alignSelf: 'stretch',
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: webColors.verifyWarn,
    borderRadius: 9,
  },
  btnLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(12),
    lineHeight: rf(16),
    color: webColors.verifyWarnInk,
  },
});
