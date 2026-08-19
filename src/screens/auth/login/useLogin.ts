import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { DEMO_AUTH } from '@constants';
import { authApi } from '@services/api';
import { useAuthStore } from '@store';
import type { AuthSession, SocialProviderId } from '@app-types/api';
import { logger } from '@utils/logger';

import { loginSchema, type LoginFormValues } from './schema';
import type { UseLoginResult } from './types';

/** All login logic. The screen component renders state; it holds none. */
export const useLogin = (): UseLoginResult => {
  const router = useRouter();
  const authenticate = useAuthStore((s) => s.authenticate);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // onChange, not onBlur — the CTA is gated on isValid, and with onBlur the
    // button stays disabled while the user is still typing.
    mode: 'onChange',
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = useCallback<SubmitHandler<LoginFormValues>>(
    async (values) => {
      setSubmitError(null);

      // --- Temporary demo bypass ------------------------------------------
      // Until the real auth API is live, the hardcoded DEMO_AUTH credentials
      // authenticate locally and jump straight to the dashboard.
      const identifier = values.identifier.trim().toLowerCase();
      if (
        identifier === DEMO_AUTH.identifier &&
        values.password === DEMO_AUTH.password
      ) {
        const demoSession: AuthSession = {
          user: {
            id: 'demo-user',
            name: 'Alex Rivera',
            email: DEMO_AUTH.identifier,
            username: 'creator',
            createdAt: new Date().toISOString(),
          },
          tokens: {
            accessToken: 'demo-access-token',
            refreshToken: 'demo-refresh-token',
          },
        };
        logger.info('Demo login success');
        await authenticate(demoSession);
        router.replace('/(app)/(tabs)/home');
        return;
      }
      // --------------------------------------------------------------------

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
    // OAuth is not wired yet — surface a friendly, separate notice near the
    // social buttons rather than the form's submit-error slot.
    logger.info('Social login requested', { provider });
    setSocialNotice(
      `${provider === 'google' ? 'Google' : 'Apple'} sign-in isn’t available yet.`,
    );
  }, []);

  return {
    control,
    isValid,
    isSubmitting,
    submitError,
    socialNotice,
    handleSubmit: handleSubmit(onSubmit),
    onSocialLogin,
    goToRegister: () => router.push('/(auth)/register'),
    goToForgotPassword: () => router.push('/(auth)/forgot-password'),
  };
};
