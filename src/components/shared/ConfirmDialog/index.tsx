import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, gradientDirection, gradients, radius } from '@theme';
import { rf } from '@utils/responsive';

export type ConfirmTone = 'danger' | 'primary';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` gives a red confirm button, `primary` the CTA gradient. */
  tone?: ConfirmTone;
  icon?: keyof typeof Feather.glyphMap;
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
  icon,
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
  const accent = danger ? colors.red : colors.pink;
  const accentFill = danger ? colors.errorSoft : colors.pinkSoft;

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
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            },
          ]}
        >
          {icon ? (
            <View style={[styles.icon, { backgroundColor: accentFill }]}>
              <Feather name={icon} size={rf(22)} color={accent} />
            </View>
          ) : null}

          <Text variant="h3" align="center" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodySm" color="textSecondary" align="center" style={styles.message}>
            {message}
          </Text>

          <Pressable
            onPress={onConfirm}
            style={styles.confirm}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            {danger ? (
              <View style={[styles.confirmFill, styles.confirmDanger]}>
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              </View>
            ) : (
              <LinearGradient
                colors={gradients.cta}
                start={gradientDirection.horizontal.start}
                end={gradientDirection.horizontal.end}
                style={styles.confirmFill}
              >
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              </LinearGradient>
            )}
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={styles.cancel}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text variant="bodyLg" color="textSecondary" style={styles.cancelLabel}>
              {cancelLabel}
            </Text>
          </Pressable>
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
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    lineHeight: rf(17),
    marginBottom: 24,
  },

  confirm: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  confirmFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDanger: {
    backgroundColor: colors.red,
  },
  confirmLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.white,
  },

  cancel: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 4,
  },
  cancelLabel: {
    fontFamily: fontFamily.bold,
  },
});
