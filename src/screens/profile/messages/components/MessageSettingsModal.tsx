import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@components/ui';
import { colors, radius, spacing, typography, webColors } from '@theme';
import { rf } from '@utils/responsive';

import { StatusPill } from './StatusPill';

interface MessageSettingsModalProps {
  visible: boolean;
  acceptsMessages: boolean;
  loadingSettings: boolean;
  price: string;
  setPrice: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

/**
 * Settings — the web's popover, as a centred popup.
 *
 * Deliberately NOT a bottom sheet: the price field sits low on a sheet
 * and the keyboard covers it the moment it's focused. Centred + keyboard
 * avoiding keeps the input and the button visible while typing.
 */
export const MessageSettingsModal = ({
  visible,
  acceptsMessages,
  loadingSettings,
  price,
  setPrice,
  saving,
  onSave,
  onClose,
}: MessageSettingsModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <Pressable
      style={styles.backdrop}
      accessibilityRole="button"
      accessibilityLabel="Close message settings"
      onPress={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdropCenter}
      >
        {/* Swallow taps inside the card so they don't dismiss it. */}
        <Pressable style={styles.popup} onPress={() => undefined}>
          <View style={styles.sheetHead}>
            <View style={[styles.shield, acceptsMessages ? styles.shieldOn : null]}>
              <Feather
                name="shield"
                size={rf(16)}
                color={acceptsMessages ? webColors.green : colors.textSecondary}
              />
            </View>
            <View style={styles.sheetCopy}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Accept private messages</Text>
                {loadingSettings ? null : <StatusPill on={acceptsMessages} />}
              </View>
              <Text style={styles.sheetSub}>
                Fans pay to send you a message. You can reply for free, any time.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.popupClose}
            >
              <Feather name="x" size={rf(15)} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Feather name="dollar-sign" size={rf(13)} color={colors.textMuted} />
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="Price"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="number-pad"
                editable={!loadingSettings && !saving}
                accessibilityLabel="Price per message"
                style={styles.input}
              />
              <Text style={styles.suffix}>/msg</Text>
            </View>

            <Pressable
              onPress={onSave}
              disabled={saving || loadingSettings}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || loadingSettings, busy: saving }}
              accessibilityLabel={acceptsMessages ? 'Turn off' : 'Turn on'}
              style={[
                styles.cta,
                acceptsMessages ? styles.ctaOff : styles.ctaOn,
                saving || loadingSettings ? styles.ctaDisabled : null,
              ]}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={acceptsMessages ? colors.textPrimary : webColors.onGreen}
                />
              ) : null}
              <Text style={acceptsMessages ? styles.ctaOffText : styles.ctaOnText}>
                {saving ? 'Saving...' : acceptsMessages ? 'Turn off' : 'Turn on'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  backdropCenter: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  popup: {
    gap: spacing.md,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webColors.panelBorder,
    backgroundColor: webColors.panelFill,
  },
  popupClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: webColors.chip,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  shield: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: webColors.cardBorder,
    backgroundColor: webColors.chip,
  },
  shieldOn: {
    borderColor: webColors.greenBorder,
    backgroundColor: webColors.greenChip,
  },
  sheetCopy: { flex: 1, minWidth: 0, gap: 4 },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  sheetTitle: {
    ...typography.h3,
    color: webColors.textStrong,
  },
  sheetSub: {
    ...typography.bodySm,
    color: webColors.textSoft,
  },

  form: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: webColors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: webColors.inputFill,
  },
  input: {
    ...typography.input,
    flex: 1,
    paddingVertical: 0,
    color: webColors.textStrong,
  },
  suffix: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  /** OFF → the web's green "register-submit" primary. */
  ctaOn: { backgroundColor: webColors.green },
  ctaOnText: {
    ...typography.buttonSm,
    color: webColors.onGreen,
  },
  /** ON → the web's neutral "secondary-button". */
  ctaOff: {
    borderWidth: 1,
    borderColor: webColors.cardBorder,
    backgroundColor: webColors.chip,
  },
  ctaOffText: {
    ...typography.buttonSm,
    color: webColors.textStrong,
  },
  ctaDisabled: { opacity: 0.6 },
});
