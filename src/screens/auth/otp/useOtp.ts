import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TIMING } from '@constants';
import {
  useRegisterMutation,
  useSendPasswordResetOtpMutation,
  useSendRegistrationOtpMutation,
  useVerifyPasswordResetOtpMutation,
  useVerifyRegistrationOtpMutation,
} from '@hooks/useAuthMutations';
import {
  clearPendingRegistration,
  getPendingRegistration,
} from '@screens/auth/register/pendingRegistration';
import type { OtpVerifyParams } from '@app-types/navigation';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';
import { LIMITS } from '@utils/validators';

import { getOtpHint, setOtpHint } from './otpHint';
import type { UseOtpResult } from './types';

const EXPIRED_SESSION =
  'That sign-up session expired. Please enter your details again.';

/**
 * OTP logic: auto-submit on the 6th digit, 60s resend cooldown, 3-attempt lock.
 *
 * Two flows share this screen:
 *
 * - `register` — verify-registration-otp, then immediately register. The
 *   server's verification window is short, so the two calls run back to back;
 *   pausing between them earns "Phone verification expired."
 * - `forgot-password` — verify, then on to the reset screen for the new
 *   password. No token is issued at this step.
 */
export const useOtp = (): UseOtpResult => {
  const router = useRouter();
  const params = useLocalSearchParams<Partial<OtpVerifyParams>>();
  const mobile = params.mobile ?? '';
  const origin: OtpVerifyParams['origin'] =
    params.origin === 'forgot-password' ? 'forgot-password' : 'register';
  const isRegister = origin === 'register';

  const { mutateAsync: verifyRegistrationOtp } = useVerifyRegistrationOtpMutation();
  const { mutateAsync: register } = useRegisterMutation();
  const { mutateAsync: sendRegistrationOtp } = useSendRegistrationOtpMutation();
  const { mutateAsync: verifyResetOtp } = useVerifyPasswordResetOtpMutation();
  const { mutateAsync: sendResetOtp } = useSendPasswordResetOtpMutation();

  const [code, setCodeValue] = useState('');
  // Seeded from whichever screen requested the code. Lazy initialiser so the
  // module read happens once, on mount, rather than on every render.
  const [otpHint, setHint] = useState<string | null>(() => getOtpHint());
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  // Explicitly `number` — TIMING is `as const`, so inference would narrow this
  // to the literal 60 and reject the countdown decrement.
  const [cooldownSec, setCooldownSec] = useState<number>(
    TIMING.otpResendCooldownSec,
  );
  const submittedFor = useRef<string | null>(null);

  const locked = attempts >= TIMING.otpMaxAttempts;
  const attemptsLeft = Math.max(0, TIMING.otpMaxAttempts - attempts);

  useEffect(() => {
    if (cooldownSec <= 0) {
      return;
    }
    const id = setInterval(() => setCooldownSec((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldownSec]);

  const rejectCode = useCallback((message: string) => {
    setAttempts((prev) => prev + 1);
    setError(message);
    setCodeValue('');
    submittedFor.current = null;
  }, []);

  /** Sign-up: verify, then create the account. Both calls, no gap. */
  const completeRegistration = useCallback(
    async (value: string) => {
      const pending = getPendingRegistration();
      if (!pending) {
        // Only reachable if the screen was reloaded or deep-linked into.
        setError(EXPIRED_SESSION);
        router.replace('/(auth)/register');
        return;
      }

      try {
        await verifyRegistrationOtp({ phone: pending.phone, otp: value });
      } catch (verifyError) {
        // A mistyped digit shouldn't cost the artist their details — the
        // pending credentials stay put so the next attempt can use them.
        rejectCode(getErrorMessage(verifyError));
        return;
      }

      await register(pending);
      clearPendingRegistration();
      logger.info('Registration complete');
      router.replace('/(app)/(tabs)/home');
    },
    [register, rejectCode, router, verifyRegistrationOtp],
  );

  /** Password reset: verify only. The new password is set on the next screen. */
  const completeResetVerification = useCallback(
    async (value: string) => {
      try {
        await verifyResetOtp({ phone: mobile, otp: value });
      } catch (verifyError) {
        rejectCode(getErrorMessage(verifyError));
        return;
      }

      logger.info('Password reset code verified');
      router.replace({
        pathname: '/(auth)/reset-password',
        params: { mobile },
      });
    },
    [mobile, rejectCode, router, verifyResetOtp],
  );

  const verify = useCallback(
    async (value: string) => {
      if (locked || isSubmitting) {
        return;
      }
      setSubmitting(true);
      setError(null);

      try {
        if (isRegister) {
          await completeRegistration(value);
        } else {
          await completeResetVerification(value);
        }
      } catch (submitFailure) {
        // Reached when the call after verification fails — an expired window,
        // or a stage name taken between screens. Use the server's wording.
        setError(getErrorMessage(submitFailure));
        setCodeValue('');
        submittedFor.current = null;
      } finally {
        setSubmitting(false);
      }
    },
    [
      completeRegistration,
      completeResetVerification,
      isRegister,
      isSubmitting,
      locked,
    ],
  );

  const setCode = useCallback((next: string) => {
    setError(null);
    setCodeValue(next);
  }, []);

  // Auto-submit exactly once when the code reaches full length.
  useEffect(() => {
    if (code.length === LIMITS.otp.length && submittedFor.current !== code) {
      submittedFor.current = code;
      void verify(code);
    }
  }, [code, verify]);

  const resend = useCallback(async () => {
    if (cooldownSec > 0) {
      return;
    }

    try {
      const sent = isRegister
        ? await sendRegistrationOtp({ phone: mobile })
        : await sendResetOtp({ phone: mobile });

      // The old code is dead now — show the new one, or nothing.
      setOtpHint(sent.otp);
      setHint(sent.otp ?? null);
      setCooldownSec(TIMING.otpResendCooldownSec);
      setError(null);
    } catch (resendError) {
      setError(getErrorMessage(resendError));
    }
  }, [cooldownSec, isRegister, mobile, sendRegistrationOtp, sendResetOtp]);

  return {
    code,
    setCode,
    isSubmitting,
    error,
    locked,
    attemptsLeft,
    cooldownSec,
    canResend: cooldownSec <= 0 && !locked,
    mobile,
    otpHint,
    resend: () => void resend(),
    goBack: () => {
      // Backing out abandons the flow: drop the held credentials rather than
      // leaving a password in memory for the rest of the session.
      clearPendingRegistration();
      router.back();
    },
  };
};
