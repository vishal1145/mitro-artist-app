import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { authApi } from '@services/api';
import { logger } from '@utils/logger';

import { registerSchema, type RegisterFormValues } from './schema';
import type { UseRegisterResult } from './types';

/** Registration logic. On success, routes to OTP verification. */
export const useRegister = (): UseRegisterResult => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { name: '', username: '', email: '', password: '' },
  });

  const onSubmit = useCallback<SubmitHandler<RegisterFormValues>>(
    async (values) => {
      setSubmitError(null);
      const result = await authApi.register(values);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      logger.info('Register success — verification required');
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { email: values.email, origin: 'register' },
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
    goToLogin: () => router.back(),
  };
};
