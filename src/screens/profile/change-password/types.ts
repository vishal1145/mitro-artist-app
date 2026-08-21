import type { Control } from 'react-hook-form';

import type { ChangePasswordFormValues } from './schema';

export interface UseChangePasswordResult {
  control: Control<ChangePasswordFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  /** Set once the server accepts the change, just before the screen closes. */
  isDone: boolean;
  handleSubmit: () => void;
  goBack: () => void;
}
