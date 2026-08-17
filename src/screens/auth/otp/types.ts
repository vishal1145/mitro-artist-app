export interface UseOtpResult {
  code: string;
  setCode: (next: string) => void;
  isSubmitting: boolean;
  error: string | null;
  locked: boolean;
  attemptsLeft: number;
  cooldownSec: number;
  canResend: boolean;
  email: string;
  resend: () => void;
  goBack: () => void;
}
