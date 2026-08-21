export interface UseOtpResult {
  code: string;
  setCode: (next: string) => void;
  isSubmitting: boolean;
  error: string | null;
  locked: boolean;
  attemptsLeft: number;
  cooldownSec: number;
  canResend: boolean;
  mobile: string;
  /**
   * The code, when the server hands it back instead of texting it. Present
   * only while SMS delivery is stubbed — it goes away by itself once a real
   * provider stops echoing the OTP in the response.
   */
  otpHint: string | null;
  resend: () => void;
  goBack: () => void;
}
