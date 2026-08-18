import {
  Controller,
  useFormState,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { Input } from '@components/ui/Input';
import type { InputProps } from '@components/ui/Input/types';

interface FormInputProps<T extends FieldValues>
  extends Omit<InputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> {
  control: Control<T>;
  name: FieldPath<T>;
}

/**
 * Bridges react-hook-form's Controller to the themed Input.
 *
 * Error display is intentionally gated: a required-field error only appears
 * once the user has actually attempted a submit, OR the field has been
 * touched *and* has content that fails validation (e.g. a malformed email).
 * Simply tabbing through an empty field should never show a "required"
 * error — that reads as broken on first load.
 */
export const FormInput = <T extends FieldValues>({
  control,
  name,
  ...inputProps
}: FormInputProps<T>) => {
  const { isSubmitted } = useFormState({ control });

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error, isTouched },
      }) => {
        const stringValue = typeof value === 'string' ? value : '';
        const hasContent = stringValue.trim().length > 0;
        const shouldShowError =
          Boolean(error) && ((isTouched && hasContent) || isSubmitted);

        return (
          <Input
            {...inputProps}
            value={stringValue}
            onChangeText={onChange}
            onBlur={onBlur}
            error={shouldShowError ? error?.message : undefined}
          />
        );
      }}
    />
  );
};
