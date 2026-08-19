import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TIMING } from '@constants';
import { authApi } from '@services/api';
import { useAuthStore } from '@store';
import type { OtpVerifyParams } from '@app-types/navigation';
import { logger } from '@utils/logger';
import { LIMITS } from '@utils/validators';

import type { UseOtpResult } from './types';

/**
 * OTP logic: auto-submit on the 6th digit, 60s resend cooldown, and a 3-attempt
 * lock. Screen renders state only.
 */
export const useOtp = (): UseOtpResult => {
  const router = useRouter();
  const params = useLocalSearchParams<Partial<OtpVerifyParams>>();
  const mobile = params.mobile ?? '';
  const origin: OtpVerifyParams['origin'] =
    params.origin === 'forgot-password' ? 'forgot-password' : 'register';

  const authenticate = useAuthStore((s) => s.authenticate);

  const [code, setCodeValue] = useState('');
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

  const verify = useCallback(
    async (value: string) => {
      if (locked || isSubmitting) {
        return;
      }
      setSubmitting(true);
      setError(null);

      const result = await authApi.verifyOtp({ mobile, code: value });
      setSubmitting(false);

      if (!result.success) {
        setAttempts((prev) => prev + 1);
        setError(result.error);
        setCodeValue('');
        submittedFor.current = null;
        return;
      }

      logger.info('OTP verified', { origin });
      if (origin === 'register') {
        await authenticate(result.data);
        router.replace('/(app)/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    },
    [authenticate, mobile, isSubmitting, locked, origin, router],
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
    const result = await authApi.resendOtp({ mobile });
    if (result.success) {
      setCooldownSec(TIMING.otpResendCooldownSec);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [cooldownSec, mobile]);

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
    resend: () => void resend(),
    goBack: () => router.back(),
  };
};
