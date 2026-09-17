import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, gradientDirection, gradients, typography } from '@theme';

export type ConfirmTone = 'danger' | 'primary';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` gives a red confirm button, `primary` the CTA gradient. */
  tone?: ConfirmTone;
  /** Shows a spinner in the confirm button and blocks re-taps / dismissal. */
  confirmLoading?: boolean;
  /** Deprecated — kept for call-site compatibility; no longer rendered. */
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed replacement for `Alert.alert`. The OS alert renders in the platform's
 * own light chrome, which reads as a bug against a dark app.
 */
const ConfirmDialogComponent = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const danger = tone === 'danger';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.scrim, { opacity: anim }]}>
        {/* Tapping the backdrop cancels, matching platform expectations. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />

        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={confirmLoading}
              style={[styles.cancel, confirmLoading && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={confirmLoading}
              style={styles.confirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <LinearGradient
                colors={danger ? ['#FF4757', '#FF6B81'] : gradients.cta}
                start={gradientDirection.horizontal.start}
                end={gradientDirection.horizontal.end}
                style={styles.confirmFill}
              >
                {confirmLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLabel}>{confirmLabel}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const ConfirmDialog = memo(ConfirmDialogComponent);

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayDim,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.125)',
    borderRadius: 12,
    padding: 24,
  },
  title: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  message: {
    ...typography.body,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.125)',
    backgroundColor: 'transparent',
  },
  cancelLabel: {
    ...typography.buttonSm,
    /* See `confirmLabel` — same descender clipping, same remedy. */
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
  confirm: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirmFill: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * `confirm` clips to its rounded corners (`overflow: 'hidden'`), so the
   * label has to fit inside the box exactly. `buttonSm`'s 18px line box is
   * tight for bold 13px Plus Jakarta Sans, and Android's extra font padding
   * pushed the glyphs down far enough that the descender in "Log out" was
   * sheared off at the bottom edge. Same failure the Save Profile button hit:
   * give the line room, drop the font padding, and centre it in the box.
   */
  confirmLabel: {
    ...typography.buttonSm,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: '#FFFFFF',
  },
});
