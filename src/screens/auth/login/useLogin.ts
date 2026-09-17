import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { useLoginMutation } from '@hooks/useAuthMutations';
import type { SocialProviderId } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';
import { hidePopupToast, showPopupToast } from '@utils/toast';

import { loginSchema, type LoginFormValues } from './schema';
import type { UseLoginResult } from './types';

/** All login logic. The screen component renders state; it holds none. */
export const useLogin = (): UseLoginResult => {
  const router = useRouter();
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
      // Clear a toast still on screen from the previous attempt, so a retry
      // never looks like it failed again before the request has resolved.
      hidePopupToast();

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
        // Only ever after the request rejects — never on press. The message is
        // the server's own 4xx copy where it sent one (see @utils/errorHandler
        // `clientMessage`), e.g. "Account not found. Check your phone number
        // or stage name and try again."
        const message = getErrorMessage(error);
        // Kept in state as well as toasted: the toast auto-dismisses after
        // 3.5s, and `submitError` is part of UseLoginResult's contract.
        setSubmitError(message);
        showPopupToast(message, 'error');
      }
    },
    [login, router],
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
