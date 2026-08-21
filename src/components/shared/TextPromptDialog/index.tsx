import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, gradientDirection, gradients, radius } from '@theme';
import { rf } from '@utils/responsive';

export interface TextPromptDialogProps {
  visible: boolean;
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  maxLength?: number;
  /** Minimum characters before the confirm button enables. */
  minLength?: number;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

/** Asks for one line of text. Reusable for any single-field create or rename. */
const TextPromptDialogComponent = ({
  visible,
  title,
  label,
  placeholder,
  confirmLabel,
  maxLength = 60,
  minLength = 2,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: TextPromptDialogProps) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState('');

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  // Start clean each time, so a cancelled entry doesn't come back.
  useEffect(() => {
    if (visible) {
      setValue('');
    }
  }, [visible]);

  const canSave = value.trim().length >= minLength;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Animated.View style={[styles.scrim, { opacity: anim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={isSaving ? undefined : onCancel}
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
              {title}
            </Text>

            <Text variant="label" color="textMuted" style={styles.label}>
              {label}
            </Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              maxLength={maxLength}
              style={styles.input}
              accessibilityLabel={label}
              onSubmitEditing={canSave ? () => onSubmit(value.trim()) : undefined}
            />

            {error ? (
              <Text variant="bodySm" color="error" align="center" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={() => onSubmit(value.trim())}
              disabled={!canSave || isSaving}
              style={[styles.confirm, !canSave || isSaving ? styles.busy : null]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <LinearGradient
                colors={gradients.cta}
                start={gradientDirection.horizontal.start}
                end={gradientDirection.horizontal.end}
                style={styles.confirmFill}
              >
                <Text style={styles.confirmLabel}>
                  {isSaving ? 'Saving…' : confirmLabel}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={onCancel}
              disabled={isSaving}
              style={styles.ghost}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text variant="bodyLg" color="textSecondary" style={styles.ghostLabel}>
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const TextPromptDialog = memo(TextPromptDialogComponent);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  label: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(11),
    marginBottom: 16,
  },
  error: {
    marginBottom: 12,
  },

  confirm: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 4,
  },
  busy: {
    opacity: 0.5,
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
