import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui';
import { gradientDirection, webGradients } from '@theme';

import { styles } from '../styles';

/** `.popup-modal-overlay` > `.popup-modal` — main.tsx 8459–8476. Shown when
 *  Delete Wheel comes back 409 (wheel has spin history). */
export const DeleteWheelConflictModal = ({
  visible,
  message,
  onClose,
  onConfirm,
  confirming,
}: {
  visible: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.popupOverlay}>
      <View style={styles.popupModal}>
        <Text style={styles.popupTitle}>Can&apos;t Delete This Wheel</Text>
        <Text style={styles.popupBody}>{message}</Text>
        <View style={styles.popupActions}>
          <Pressable onPress={onClose} style={styles.popupCancel} accessibilityRole="button">
            <Text style={styles.popupCancelLabel}>Close</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={confirming}
            style={styles.popupConfirm}
            accessibilityRole="button"
            accessibilityState={{ disabled: confirming, busy: confirming }}
          >
            <LinearGradient
              colors={webGradients.popupConfirm}
              start={gradientDirection.diagonal.start}
              end={gradientDirection.diagonal.end}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.popupConfirmLabel}>
              {confirming ? 'Turning off…' : 'Turn Off Instead'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);
