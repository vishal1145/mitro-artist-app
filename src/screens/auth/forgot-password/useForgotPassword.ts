import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { useSendPasswordResetOtpMutation } from '@hooks/useAuthMutations';
import { setOtpHint } from '@screens/auth/otp/otpHint';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from './schema';
import type { UseForgotPasswordResult } from './types';

/**
 * Password reset step 1 — request the code, then hand off to the shared OTP
 * screen. Step 2 verifies, step 3 sets the new password.
 */
export const useForgotPassword = (): UseForgotPasswordResult => {
  const router = useRouter();
  const { mutateAsync: sendOtp, isPending } = useSendPasswordResetOtpMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { mobile: '' },
  });

  const onSubmit = useCallback<SubmitHandler<ForgotPasswordFormValues>>(
    async (values) => {
      setSubmitError(null);
      const phone = values.mobile.trim();

      try {
        const sent = await sendOtp({ phone });
        setOtpHint(sent.otp);

        logger.info('Password reset code requested');
        router.push({
          pathname: '/(auth)/otp-verify',
          params: { mobile: phone, origin: 'forgot-password' },
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
    goBack: () => router.back(),
  };
};
