import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { authApi } from '@services/api';
import { logger } from '@utils/logger';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from './schema';
import type { UseForgotPasswordResult } from './types';

/** Forgot-password logic. On success, routes to OTP verification. */
export const useForgotPassword = (): UseForgotPasswordResult => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onSubmit = useCallback<SubmitHandler<ForgotPasswordFormValues>>(
    async (values) => {
      setSubmitError(null);
      const result = await authApi.forgotPassword(values);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      logger.info('Password reset code requested');
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { email: values.email, origin: 'forgot-password' },
      });
    },
    [router],
  );

  return {
    control,
    isValid,
    isSubmitting,
    submitError,
    handleSubmit: handleSubmit(onSubmit),
    goBack: () => router.back(),
  };
};
