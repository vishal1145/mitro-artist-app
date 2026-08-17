import {
  Controller,
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
 * Bridges react-hook-form's Controller to the themed Input. Errors show on
 * blur (Input surfaces the message); the parent form owns validation mode.
 */
export const FormInput = <T extends FieldValues>({
  control,
  name,
  ...inputProps
}: FormInputProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error, isTouched } }) => (
        <Input
          {...inputProps}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={isTouched ? error?.message : undefined}
        />
      )}
    />
  );
};
