import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { authApi } from '@services/api';
import { useAuthStore } from '@store';
import type { SocialProviderId } from '@types/api';
import { logger } from '@utils/logger';

import { loginSchema, type LoginFormValues } from './schema';
import type { UseLoginResult } from './types';

/** All login logic. The screen component renders state; it holds none. */
export const useLogin = (): UseLoginResult => {
  const router = useRouter();
  const authenticate = useAuthStore((s) => s.authenticate);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = useCallback<SubmitHandler<LoginFormValues>>(
    async (values) => {
      setSubmitError(null);
      const result = await authApi.login({
        identifier: values.identifier,
        password: values.password,
      });

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      logger.info('Login success');
      await authenticate(result.data);
      router.replace('/(app)/(tabs)/home');
    },
    [authenticate, router],
  );

  const onSocialLogin = useCallback((provider: SocialProviderId) => {
    // OAuth is not wired yet — surface a friendly message until it is.
    logger.info('Social login requested', { provider });
    setSubmitError(
      `${provider === 'google' ? 'Google' : 'Apple'} sign-in isn’t available yet.`,
    );
  }, []);

  return {
    control,
    isValid,
    isSubmitting,
    submitError,
    handleSubmit: handleSubmit(onSubmit),
    onSocialLogin,
    goToRegister: () => router.push('/(auth)/register'),
    goToForgotPassword: () => router.push('/(auth)/forgot-password'),
  };
};
