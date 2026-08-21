import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { DEMO_AUTH } from '@constants';
import { useLoginMutation } from '@hooks/useAuthMutations';
import { USE_MOCK } from '@services/api';
import { useAuthStore } from '@store';
import type { AuthSession, SocialProviderId } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { loginSchema, type LoginFormValues } from './schema';
import type { UseLoginResult } from './types';

/** All login logic. The screen component renders state; it holds none. */
export const useLogin = (): UseLoginResult => {
  const router = useRouter();
  const authenticate = useAuthStore((s) => s.authenticate);
  const { mutateAsync: login, isPending } = useLoginMutation();
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

      // --- Demo bypass, mock mode only -------------------------------------
      // Lets the screens be exercised without a backend. Never reachable once
      // USE_MOCK is false, so it can't shadow a real account in production.
      const identifier = values.identifier.trim().toLowerCase();
      if (
        USE_MOCK &&
        identifier === DEMO_AUTH.identifier &&
        values.password === DEMO_AUTH.password
      ) {
        const demoSession: AuthSession = {
          user: {
            id: 'demo-artist',
            name: 'Alex Rivera',
            username: 'creator',
            approvalStatus: 'Approved',
          },
          tokens: { accessToken: 'demo-access-token' },
        };
        logger.info('Demo login success');
        await authenticate(demoSession);
        router.replace('/(app)/(tabs)/home');
        return;
      }
      // ---------------------------------------------------------------------

      try {
        // One field either way — the server decides whether it's a mobile
        // number or a stage name.
        await login({
          phoneOrStageName: values.identifier.trim(),
          password: values.password,
        });
        logger.info('Login success');
        router.replace('/(app)/(tabs)/home');
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
    [authenticate, login, router],
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
    // The mutation owns the in-flight state; RHF's own flag misses the window
    // between the request resolving and navigation completing.
    isSubmitting: isSubmitting || isPending,
    submitError,
    socialNotice,
    handleSubmit: handleSubmit(onSubmit),
    onSocialLogin,
    goToRegister: () => router.push('/(auth)/register'),
    goToForgotPassword: () => router.push('/(auth)/forgot-password'),
  };
};
