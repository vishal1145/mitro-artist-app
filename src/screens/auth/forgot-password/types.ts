import type { Control } from 'react-hook-form';

import type { ForgotPasswordFormValues } from './schema';

export interface UseForgotPasswordResult {
  control: Control<ForgotPasswordFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: () => void;
  goBack: () => void;
}
