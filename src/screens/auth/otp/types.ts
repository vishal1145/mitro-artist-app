export interface UseOtpResult {
  code: string;
  setCode: (next: string) => void;
  isSubmitting: boolean;
  error: string | null;
  locked: boolean;
  attemptsLeft: number;
  /**
   * True only when the server rejected the CODE itself.
   *
   * The sign-up flow verifies and then registers, and a registration failure
   * ("Stage name already exists.") used to render with " N attempt(s) left."
   * appended — which reads as though the code were wrong. The screen uses
   * this to decide whether the attempts counter belongs on the message.
   */
  codeRejected: boolean;
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
