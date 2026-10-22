import type { Control } from 'react-hook-form';

import type { SocialProviderId } from '@app-types/api';

import type { LoginFormValues } from './schema';

export interface UseLoginResult {
  control: Control<LoginFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  /** Info message from tapping a social provider button (separate from form errors). */
  socialNotice: string | null;
  handleSubmit: () => void;
  /** Read / replace the identifier field - used to keep Mobile Number and Stage Name entries separate per tab. */
  getIdentifier: () => string;
  setIdentifier: (value: string) => void;
  onSocialLogin: (provider: SocialProviderId) => void;
  goToRegister: () => void;
  goToForgotPassword: () => void;
}
