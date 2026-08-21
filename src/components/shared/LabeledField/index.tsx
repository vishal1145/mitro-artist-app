import {
  Controller,
  useFormState,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, radius } from '@theme';
import { rf } from '@utils/responsive';

interface LabeledFieldProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'style'> {
  control: Control<T>;
  name: FieldPath<T>;
  /** Uppercase label above the field. */
  label: string;
  multiline?: boolean;
  /** Normalise keystrokes before they reach form state. */
  transform?: (value: string) => string;
  /** Shows "12 / 160" beside the label. Needs `maxLength` to read well. */
  counter?: number;
}

/**
 * Settings-style labelled input, bound to react-hook-form.
 *
 * Deliberately not the shared `Input`: this screen's fields have their own
 * look (uppercase label above a flat field) and swapping them would restyle a
 * screen that's already signed off. What this adds is the part that was
 * missing — the inline error, rendered the same way every other form in the
 * app renders one.
 */
export const LabeledField = <T extends FieldValues>({
  control,
  name,
  label,
  multiline,
  transform,
  counter,
  ...inputProps
}: LabeledFieldProps<T>) => {
  const { isSubmitted } = useFormState({ control });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error, isTouched } }) => {
        const stringValue = typeof value === 'string' ? value : '';
        // Errors surface on blur or after a submit attempt, never on first
        // render — matching FormInput's behaviour elsewhere.
        const showError = Boolean(error) && (isTouched || isSubmitted);

        return (
          <View>
            <View style={styles.labelRow}>
              <Text variant="label" color="textMuted" style={styles.label}>
                {label}
              </Text>
              {counter ? (
                <Text
                  variant="label"
                  color={stringValue.length > counter ? 'error' : 'textMuted'}
                >
                  {stringValue.length} / {counter}
                </Text>
              ) : null}
            </View>

            <TextInput
              {...inputProps}
              value={stringValue}
              onChangeText={(next) => onChange(transform ? transform(next) : next)}
              onBlur={onBlur}
              multiline={multiline}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                multiline ? styles.textarea : null,
                showError ? styles.inputError : null,
              ]}
              accessibilityLabel={label}
            />

            {showError ? (
              <Text variant="bodySm" color="error" style={styles.error}>
                {error?.message}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    flexShrink: 1,
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
    marginBottom: 18,
  },
  inputError: {
    borderColor: colors.errorBorder,
    marginBottom: 4,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    marginBottom: 14,
  },
});
