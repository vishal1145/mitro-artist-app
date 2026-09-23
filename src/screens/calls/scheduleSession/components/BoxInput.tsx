import { memo } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { typography } from '@theme';

import { web } from '../webTokens';

interface BoxInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
}

const BoxInputComponent = ({ value, onChangeText, placeholder, numeric, multiline }: BoxInputProps) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={web.placeholder}
    keyboardType={numeric ? 'number-pad' : 'default'}
    multiline={multiline}
    textAlignVertical={multiline ? 'top' : 'center'}
    style={[styles.input, styles.inputText, multiline ? styles.inputMultiline : null]}
  />
);

export const BoxInput = memo(BoxInputComponent);
BoxInput.displayName = 'BoxInput';

/* .gsched-field input / textarea */
const styles = StyleSheet.create({
  // The field box. Shared with the two read-only <View> fields below, so it
  // carries no text style of its own — see `inputText`.
  input: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: web.textStrong,
    borderWidth: 1,
    borderColor: web.inputBorder,
    borderRadius: 10,
    backgroundColor: web.inputBg,
  },
  inputText: {
    ...typography.input,
  },
  inputMultiline: {
    minHeight: 60,
  },
});
