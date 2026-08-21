import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { useSendRegistrationOtpMutation } from '@hooks/useAuthMutations';
import { setOtpHint } from '@screens/auth/otp/otpHint';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { setPendingRegistration } from './pendingRegistration';
import { registerSchema, type RegisterFormValues } from './schema';
import type { UseRegisterResult } from './types';

/**
 * Registration step 1.
 *
 * The account isn't created here. This screen only asks the server to text a
 * code to the number; the OTP screen verifies it and then completes
 * `POST /register`, which is the call that returns a token. The credentials
 * ride across in memory (see pendingRegistration) rather than as route params.
 */
export const useRegister = (): UseRegisterResult => {
  const router = useRouter();
  const { mutateAsync: sendOtp, isPending } = useSendRegistrationOtpMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { username: '', mobile: '', password: '' },
  });

  const onSubmit = useCallback<SubmitHandler<RegisterFormValues>>(
    async (values) => {
      setSubmitError(null);
      const phone = values.mobile.trim();

      try {
        const sent = await sendOtp({ phone });
        setOtpHint(sent.otp);

        // Stash only after the code is actually on its way, so a failed send
        // never leaves stale credentials behind.
        setPendingRegistration({
          phone,
          stageName: values.username.trim(),
          password: values.password,
        });

        logger.info('Registration OTP sent');
        router.push({
          pathname: '/(auth)/otp-verify',
          params: { mobile: phone, origin: 'register' },
        });
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
    [router, sendOtp],
  );

  return {
    control,
    isValid,
    isSubmitting: isSubmitting || isPending,
    submitError,
    handleSubmit: handleSubmit(onSubmit),
    goToLogin: () => router.back(),
  };
};
