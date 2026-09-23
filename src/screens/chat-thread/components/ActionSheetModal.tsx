import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { colors } from '@theme';

export interface ActionSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The bottom action-sheet shell (fade-in backdrop + rounded sheet) shared by
 * the long-press message actions and the header "Options" sheet — same
 * markup, different `ActionRow` children.
 */
export const ActionSheetModal = ({ visible, onClose, children }: ActionSheetModalProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.sheetBackdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        {children}
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.screen,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
});
