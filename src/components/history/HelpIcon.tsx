import { memo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from './styles';

/**
 * `.info-help-icon` — the faint HelpCircle beside almost every label on these
 * pages.
 *
 * The web opens its `data-tooltip` on hover. A phone has no hover, so the
 * glyph is a button instead: tapping it shows the same copy in a small popup.
 * The `hint` strings are the web's `data-tooltip` values verbatim.
 */
export const HelpIcon = memo(({ hint, size = 12 }: { hint: string; size?: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="What does this mean?"
        accessibilityHint={hint}
      >
        <LucideIcon name="circle-help" size={rf(size)} color={webColors.white35} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Tap anywhere to dismiss — no close button, same as letting the
            cursor leave the icon on the web. */}
        <Pressable style={styles.tooltipBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{hint}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
});
HelpIcon.displayName = 'HelpIcon';
