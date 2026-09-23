import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import { fontFamily, webColors } from '@theme';
import { rf } from '@utils/responsive';

/* -------------------------------------------------------------------------- */
/* HelpTip — the web's "?" tooltip. Hover doesn't exist on a phone, so tapping  */
/* the icon opens the same explanatory text in a small dismissible popup.        */
/* -------------------------------------------------------------------------- */

interface HelpTipProps {
  text: string;
  color?: string;
}

export const HelpTip = ({ text, color }: HelpTipProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="More information"
      >
        <LucideIcon name="circle-help" size={rf(12)} color={color ?? webColors.dim} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.tipScrim} onPress={() => setOpen(false)}>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>{text}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

/* HelpTip popup -------------------------------------------------------- */
const styles = StyleSheet.create({
  tipScrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  tipCard: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 340,
    padding: 16,
  },
  tipText: {
    color: webColors.muted,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(19),
  },
});
