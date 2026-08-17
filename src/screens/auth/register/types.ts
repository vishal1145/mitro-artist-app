import type { Control } from 'react-hook-form';

import type { RegisterFormValues } from './schema';

export interface UseRegisterResult {
  control: Control<RegisterFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: () => void;
  goToLogin: () => void;
}
