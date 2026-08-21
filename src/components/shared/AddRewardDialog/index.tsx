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

export interface AddRewardDialogProps {
  visible: boolean;
  isSaving: boolean;
  error?: string | null;
  onSubmit: (name: string, tokens: number) => void;
  onCancel: () => void;
}

const NAME_MAX = 40;
const TOKENS_MAX = 9999;

/**
 * Adds a reward to the menu.
 *
 * Two fields is too small a form to justify react-hook-form and a resolver —
 * the rules are "not empty" and "a number in range", checked inline. Anything
 * with more fields than this belongs in a screen with a proper schema.
 */
const AddRewardDialogComponent = ({
  visible,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: AddRewardDialogProps) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState('');
  const [tokens, setTokens] = useState('');

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  // Start clean each time it opens, so a cancelled reward doesn't reappear.
  useEffect(() => {
    if (visible) {
      setName('');
      setTokens('');
    }
  }, [visible]);

  const parsedTokens = Number.parseInt(tokens, 10);
  const canSave =
    name.trim().length >= 2 &&
    Number.isFinite(parsedTokens) &&
    parsedTokens > 0 &&
    parsedTokens <= TOKENS_MAX;

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
              Add reward
            </Text>

            <Text variant="label" color="textMuted" style={styles.label}>
              REWARD NAME
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Silver Mic"
              placeholderTextColor={colors.textMuted}
              maxLength={NAME_MAX}
              style={styles.input}
              accessibilityLabel="Reward name"
            />

            <Text variant="label" color="textMuted" style={styles.label}>
              TOKENS
            </Text>
            <TextInput
              value={tokens}
              onChangeText={(v) => setTokens(v.replace(/\D/g, ''))}
              placeholder="25"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
              accessibilityLabel="Token price"
            />

            {error ? (
              <Text variant="bodySm" color="error" align="center" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              onPress={() => onSubmit(name.trim(), parsedTokens)}
              disabled={!canSave || isSaving}
              style={[styles.confirm, !canSave || isSaving ? styles.busy : null]}
              accessibilityRole="button"
              accessibilityLabel="Save reward"
            >
              <LinearGradient
                colors={gradients.cta}
                start={gradientDirection.horizontal.start}
                end={gradientDirection.horizontal.end}
                style={styles.confirmFill}
              >
                <Text style={styles.confirmLabel}>
                  {isSaving ? 'Saving…' : 'Add reward'}
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

export const AddRewardDialog = memo(AddRewardDialogComponent);

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
