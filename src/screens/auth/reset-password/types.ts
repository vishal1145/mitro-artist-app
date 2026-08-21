import type { Control } from 'react-hook-form';

import type { ResetPasswordFormValues } from './schema';

export interface UseResetPasswordResult {
  control: Control<ResetPasswordFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  /** The number being reset, for the on-screen confirmation line. */
  mobile: string;
  handleSubmit: () => void;
  goToLogin: () => void;
}
