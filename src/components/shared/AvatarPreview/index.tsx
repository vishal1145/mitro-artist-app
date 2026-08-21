import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, gradientDirection, gradients, radius } from '@theme';
import { rf } from '@utils/responsive';

export interface AvatarPreviewProps {
  visible: boolean;
  /** Local file URI of the picked image. */
  uri: string | null;
  isUploading: boolean;
  error?: string | null;
  onConfirm: () => void;
  onChooseAnother: () => void;
  onCancel: () => void;
}

const PREVIEW = 132;

/**
 * Confirmation step after picking a profile picture.
 *
 * Exists because the OS crop screen's button says "CROP" and can't be
 * relabelled or restyled — which reads as "edit" rather than "save" and left
 * people unsure the upload had happened. Skipping the OS editor and asking
 * here instead keeps the wording ours, matches the app's chrome, and shows the
 * picture in the circle it will actually appear in.
 */
const AvatarPreviewComponent = ({
  visible,
  uri,
  isUploading,
  error,
  onConfirm,
  onChooseAnother,
  onCancel,
}: AvatarPreviewProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.scrim, { opacity: anim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          // Backdrop can't cancel mid-upload — the request is already away.
          onPress={isUploading ? undefined : onCancel}
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
          <Text variant="h3" align="center" style={styles.title}>
            Use this photo?
          </Text>

          {/* Shown in the same circle it lands in, so there are no surprises. */}
          <LinearGradient
            colors={gradients.ring}
            start={gradientDirection.diagonal.start}
            end={gradientDirection.diagonal.end}
            style={styles.ring}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={styles.preview}
                contentFit="cover"
                accessibilityLabel="Selected photo"
              />
            ) : null}
          </LinearGradient>

          {error ? (
            <Text variant="bodySm" color="error" align="center" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={onConfirm}
            disabled={isUploading}
            style={[styles.confirm, isUploading ? styles.busy : null]}
            accessibilityRole="button"
            accessibilityLabel="Upload photo"
          >
            <LinearGradient
              colors={gradients.cta}
              start={gradientDirection.horizontal.start}
              end={gradientDirection.horizontal.end}
              style={styles.confirmFill}
            >
              <Text style={styles.confirmLabel}>
                {isUploading ? 'Uploading…' : 'Upload Photo'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onChooseAnother}
            disabled={isUploading}
            style={styles.ghost}
            accessibilityRole="button"
            accessibilityLabel="Choose another photo"
          >
            <Text variant="bodyLg" color="textSecondary" style={styles.ghostLabel}>
              Choose another
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const AvatarPreview = memo(AvatarPreviewComponent);

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
    paddingTop: 26,
    paddingBottom: 18,
  },
  title: {
    marginBottom: 20,
  },
  ring: {
    width: PREVIEW,
    height: PREVIEW,
    borderRadius: PREVIEW / 2,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  preview: {
    width: PREVIEW - 6,
    height: PREVIEW - 6,
    borderRadius: (PREVIEW - 6) / 2,
  },
  error: {
    marginBottom: 16,
  },

  confirm: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  busy: {
    opacity: 0.6,
  },
  confirmFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  confirmLabel: {
    fontFamily: fontFamily.bold,
    fontSize: rf(13),
    color: colors.white,
  },

  ghost: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 4,
  },
  ghostLabel: {
    fontFamily: fontFamily.bold,
  },
});
