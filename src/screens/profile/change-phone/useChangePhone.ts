import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TIMING } from '@constants';
import {
  useSendChangePhoneOtpMutation,
  useVerifyChangePhoneOtpMutation,
} from '@hooks/useProfileMutations';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';
import { LIMITS, mobileSchema } from '@utils/validators';

export type ChangePhoneStage = 'number' | 'code';

export interface UseChangePhoneResult {
  stage: ChangePhoneStage;
  phone: string;
  setPhone: (next: string) => void;
  /** True when the number passes the same rule sign-up uses. */
  canSendCode: boolean;
  sendCode: () => void;
  code: string;
  setCode: (next: string) => void;
  /** Echoed back by the server while SMS delivery is stubbed. */
  otpHint: string | null;
  isBusy: boolean;
  error: string | null;
  isDone: boolean;
  cooldownSec: number;
  canResend: boolean;
  resend: () => void;
  goBack: () => void;
}

/** How long the success state stays up before the modal dismisses itself. */
const CONFIRM_MS = 900;

/**
 * Changing the signed-in artist's number: enter it, then confirm the code.
 *
 * One screen in two stages rather than two routes — the second stage is
 * meaningless without the first, and a separate route could be deep-linked
 * into with no number to verify.
 */
export const useChangePhone = (): UseChangePhoneResult => {
  const router = useRouter();
  const { mutateAsync: sendOtp, isPending: isSending } =
    useSendChangePhoneOtpMutation();
  const { mutateAsync: verifyOtp, isPending: isVerifying } =
    useVerifyChangePhoneOtpMutation();

  const [stage, setStage] = useState<ChangePhoneStage>('number');
  const [phone, setPhoneValue] = useState('');
  const [code, setCodeValue] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setDone] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const submittedFor = useRef<string | null>(null);

  const canSendCode = mobileSchema.safeParse(phone).success;

  useEffect(() => {
    if (cooldownSec <= 0) {
      return;
    }
    const id = setInterval(() => setCooldownSec((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldownSec]);

  const requestCode = useCallback(async () => {
    setError(null);
    try {
      const sent = await sendOtp({ newPhone: phone });
      setOtpHint(sent.otp ?? null);
      setCooldownSec(TIMING.otpResendCooldownSec);
      setStage('code');
    } catch (sendError) {
      setError(getErrorMessage(sendError));
    }
  }, [phone, sendOtp]);

  const confirm = useCallback(
    async (value: string) => {
      setError(null);
      try {
        await verifyOtp({ newPhone: phone, otp: value });
        logger.info('Phone number changed');
        setDone(true);
        setTimeout(() => router.back(), CONFIRM_MS);
      } catch (verifyError) {
        setError(getErrorMessage(verifyError));
        setCodeValue('');
        submittedFor.current = null;
      }
    },
    [phone, router, verifyOtp],
  );

  // Auto-submit exactly once when the code reaches full length.
  useEffect(() => {
    if (
      stage === 'code' &&
      code.length === LIMITS.otp.length &&
      submittedFor.current !== code
    ) {
      submittedFor.current = code;
      void confirm(code);
    }
  }, [code, confirm, stage]);

  return {
    stage,
    phone,
    setPhone: (next) => {
      setError(null);
      setPhoneValue(next.replace(/\D/g, '').slice(0, 10));
    },
    canSendCode,
    sendCode: () => void requestCode(),
    code,
    setCode: (next) => {
      setError(null);
      setCodeValue(next);
    },
    otpHint,
    isBusy: isSending || isVerifying,
    error,
    isDone,
    cooldownSec,
    canResend: cooldownSec <= 0,
    resend: () => void requestCode(),
    goBack: () => router.back(),
  };
};
