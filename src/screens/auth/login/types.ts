import type { Control } from 'react-hook-form';

import type { SocialProviderId } from '@types/api';

import type { LoginFormValues } from './schema';

export interface UseLoginResult {
  control: Control<LoginFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: () => void;
  onSocialLogin: (provider: SocialProviderId) => void;
  goToRegister: () => void;
  goToForgotPassword: () => void;
}
