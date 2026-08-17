import { memo, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing, HIT_TARGET } from '@theme';
import { LIMITS } from '@utils/validators';
import { hp, wp } from '@utils/responsive';

export interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

const CELLS = Array.from({ length: LIMITS.otp.length }, (_, i) => i);

/** 6-cell numeric OTP field backed by a single hidden input. */
const OtpInputComponent = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) => {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string): void => {
    const digits = text.replace(/\D/g, '').slice(0, LIMITS.otp.length);
    onChange(digits);
  };

  const focus = (): void => inputRef.current?.focus();

  return (
    <Pressable
      onPress={focus}
      accessibilityRole="none"
      accessibilityLabel="One-time passcode"
    >
      <View style={styles.row}>
        {CELLS.map((index) => {
          const char = value[index] ?? '';
          const active = index === value.length;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                active ? styles.cellActive : null,
                hasError ? styles.cellError : null,
              ]}
            >
              <Text variant="h2">{char}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={LIMITS.otp.length}
        editable={!disabled}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel="Enter 6-digit code"
      />
    </Pressable>
  );
};

export const OtpInput = memo(OtpInputComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    height: hp(8),
    minHeight: HIT_TARGET,
    borderRadius: radius.md,
    borderWidth: wp(0.3),
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: colors.inputBorderFocused,
  },
  cellError: {
    borderColor: colors.error,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
