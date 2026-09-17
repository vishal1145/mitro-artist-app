import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useProfile } from '@hooks/useProfile';
import { showPopupToast } from '@utils/toast';

/**
 * KYC / approval gate — a 1:1 port of the artist web's `guardedNavigate` and
 * its dashboard `verificationBanner`
 * (Mitro.Artist.UI/src/main.tsx, `CreatorSideScreen` and `CreatorShell`).
 *
 * Web gates exactly three destinations — `VERIFICATION_GATED_SCREENS` —
 * go-live, schedule-session and private-calls. Tapping one while unverified
 * toasts and drops the artist on the KYC tab instead of navigating. The app's
 * equivalents are the Live tab, `calls/schedule-session` and
 * `calls/private-calls`; KYC is its own route rather than a settings tab.
 */

/** Where the gate sends an unverified artist. Web: settings, `kyc` tab. */
const KYC_ROUTE = '/(app)/(tabs)/me/kyc-payouts' as const;

const BLOCKED_MESSAGE =
  'Complete your KYC verification before you can go live, host a group call, or accept private calls.';

const UNDER_REVIEW_MESSAGE =
  "Your KYC is still under review — you'll be able to go live, host group calls, and accept private calls once it's approved.";

export interface VerificationBannerCopy {
  tone: 'warn' | 'danger' | 'info';
  headline: string;
  body: string;
  /** Only the actionable tones offer "Complete Verification". */
  showButton: boolean;
}

export interface VerificationGate {
  /** True once the profile says this artist can't go live / host / take calls. */
  blocked: boolean;
  /** "" | "pending" | "approved" | "rejected", lowercased. */
  kycStatus: string;
  approvalStatus: string;
  /** The dashboard strip, or null when there is nothing to say. */
  banner: VerificationBannerCopy | null;
  /** Run `action`, or toast + divert to KYC when the artist is blocked. */
  guard: (action: () => void) => void;
  goToKyc: () => void;
}

export const useVerificationGate = (): VerificationGate => {
  const router = useRouter();
  const { data: profile } = useProfile();

  const kycStatus = (profile?.kycStatus ?? '').toLowerCase();
  const approvalStatus = (profile?.approvalStatus ?? '').toLowerCase();

  // Unblocked until the profile has actually loaded — same as web, whose
  // `verification` state starts `{ blocked: false }` until `getMe` resolves.
  // Guessing "blocked" here would stop a fully verified artist going live on
  // a cold start.
  const blocked = profile
    ? approvalStatus !== 'approved' || kycStatus !== 'approved'
    : false;

  const goToKyc = useCallback(() => {
    router.push(KYC_ROUTE);
  }, [router]);

  const guard = useCallback(
    (action: () => void) => {
      if (!blocked) {
        action();
        return;
      }

      // Already submitted and awaiting admin review — nothing left for the
      // artist to fix, so this is informational rather than an error.
      if (kycStatus === 'pending') {
        showPopupToast(UNDER_REVIEW_MESSAGE, 'info');
      } else {
        showPopupToast(BLOCKED_MESSAGE, 'error');
      }
      goToKyc();
    },
    [blocked, goToKyc, kycStatus],
  );

  /**
   * Five mutually exclusive states, in web's order. `rejected` outranks
   * everything because it's the only one the artist must act on twice.
   */
  let banner: VerificationBannerCopy | null = null;
  if (profile) {
    if (kycStatus === 'rejected') {
      banner = {
        tone: 'danger',
        headline: 'Your KYC verification was rejected',
        body: "Review the reason under KYC & Payouts and resubmit your documents to continue. You can't go live, host a group call, or accept private calls until this is complete.",
        showButton: true,
      };
    } else if (approvalStatus === 'rejected') {
      banner = {
        tone: 'danger',
        headline: 'Your artist application was rejected',
        body: "Review the reason under KYC & Payouts and resubmit your documents to continue. You can't go live, host a group call, or accept private calls until this is complete.",
        showButton: true,
      };
    } else if (kycStatus === '') {
      banner = {
        tone: 'warn',
        headline: 'Complete KYC verification to unlock payouts',
        body: "Submit your PAN, Aadhaar, and bank details so we can verify your identity and enable payouts. You can't go live, host a group call, or accept private calls until this is complete.",
        showButton: true,
      };
    } else if (kycStatus === 'pending') {
      banner = {
        tone: 'info',
        headline: 'Your KYC is under review',
        body: "Please wait — our team usually reviews documents within 24–48 hours. You'll be able to go live, host a group call, and accept private calls once it's approved.",
        showButton: false,
      };
    } else if (approvalStatus === 'pending') {
      banner = {
        tone: 'info',
        headline: 'Your profile is pending approval',
        body: "Please complete your profile and wait for admin approval. You'll be able to go live, host a group call, and accept private calls once it's approved.",
        showButton: false,
      };
    }
  }

  return { blocked, kycStatus, approvalStatus, banner, guard, goToKyc };
};
