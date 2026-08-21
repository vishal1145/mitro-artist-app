import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { useChangePasswordMutation } from '@hooks/useProfileMutations';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { changePasswordSchema, type ChangePasswordFormValues } from './schema';
import type { UseChangePasswordResult } from './types';

/** How long the success state stays up before the modal dismisses itself. */
const CONFIRM_MS = 900;

export const useChangePassword = (): UseChangePasswordResult => {
  const router = useRouter();
  const { mutateAsync: changePassword, isPending } = useChangePasswordMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDone, setDone] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = useCallback<SubmitHandler<ChangePasswordFormValues>>(
    async (values) => {
      setSubmitError(null);

      try {
        await changePassword(values);
        logger.info('Password changed');

        // Show the confirmation briefly — closing instantly reads as if
        // nothing happened.
        setDone(true);
        setTimeout(() => router.back(), CONFIRM_MS);
      } catch (error) {
        setSubmitError(getErrorMessage(error));
      }
    },
    [changePassword, router],
  );

  return {
    control,
    isValid,
    isSubmitting: isSubmitting || isPending,
    submitError,
    isDone,
    handleSubmit: handleSubmit(onSubmit),
    goBack: () => router.back(),
  };
};
