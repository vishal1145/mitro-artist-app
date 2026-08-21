import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { useResetPasswordMutation } from '@hooks/useAuthMutations';
import { clearOtpHint } from '@screens/auth/otp/otpHint';
import type { ResetPasswordParams } from '@app-types/navigation';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { resetPasswordSchema, type ResetPasswordFormValues } from './schema';
import type { UseResetPasswordResult } from './types';

/**
 * Password reset step 3.
 *
 * Only reachable once the OTP screen has verified the number. The server
 * returns a message rather than a session, so the artist signs in afterwards
 * with the password they just chose.
 */
export const useResetPassword = (): UseResetPasswordResult => {
  const router = useRouter();
  const params = useLocalSearchParams<Partial<ResetPasswordParams>>();
  const mobile = params.mobile ?? '';

  const { mutateAsync: resetPassword, isPending } = useResetPasswordMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = useCallback<SubmitHandler<ResetPasswordFormValues>>(
    async (values) => {
      setSubmitError(null);

      try {
        await resetPassword({
          phone: mobile,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });

        // The code is spent — don't let it linger and show up on a later flow.
        clearOtpHint();
        logger.info('Password reset complete');
        router.replace('/(auth)/login');
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
    [mobile, resetPassword, router],
  );

  return {
    control,
    isValid,
    isSubmitting: isSubmitting || isPending,
    submitError,
    mobile,
    handleSubmit: handleSubmit(onSubmit),
    goToLogin: () => router.replace('/(auth)/login'),
  };
};
