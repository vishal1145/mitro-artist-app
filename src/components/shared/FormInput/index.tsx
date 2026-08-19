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
  /**
   * Normalise keystrokes before they reach form state — e.g. strip spaces,
   * force lowercase, or keep digits only.
   */
  transform?: (value: string) => string;
}

/**
 * Bridges react-hook-form's Controller to the themed Input.
 *
 * Errors surface on blur or after a submit attempt, never on first render.
 */
export const FormInput = <T extends FieldValues>({
  control,
  name,
  transform,
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
        // Errors surface on blur or after a submit attempt — never on first render.
        const shouldShowError = Boolean(error) && (isTouched || isSubmitted);

        return (
          <Input
            {...inputProps}
            value={stringValue}
            onChangeText={(next) => onChange(transform ? transform(next) : next)}
            onBlur={onBlur}
            error={shouldShowError ? error?.message : undefined}
          />
        );
      }}
    />
  );
};
