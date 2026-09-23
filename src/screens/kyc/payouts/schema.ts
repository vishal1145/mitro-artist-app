import type { KycState, MissingReasonFlags } from './types';

// KycSettingsTab.tsx 114–174, ported 1:1.
export const PAN_REGEX = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/;
export const AADHAAR_REGEX = /^\d{12}$/;
export const ACCOUNT_NUMBER_REGEX = /^[0-9]{6,20}$/;
export const IFSC_REGEX = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;

export const isPanNumberValid = (panNumber: string, unchanged: boolean): boolean =>
  unchanged || PAN_REGEX.test(panNumber);

export const isAadhaarNumberValid = (aadhaarNumber: string, unchanged: boolean): boolean =>
  unchanged || AADHAAR_REGEX.test(aadhaarNumber);

export const isAccountNumberValid = (accountNumber: string, unchanged: boolean): boolean =>
  unchanged || ACCOUNT_NUMBER_REGEX.test(accountNumber);

export const doAccountNumbersMatch = (
  accountNumber: string,
  confirmAccountNumber: string,
): boolean => accountNumber === confirmAccountNumber;

export const isIfscValid = (ifscCode: string): boolean => IFSC_REGEX.test(ifscCode);

export const isReadOnlyKyc = (
  status: string | undefined,
  approvalStatus: string | undefined,
): boolean => status === 'approved' || approvalStatus === 'approved';

/** Exact same ordered, user-facing copy as the original inline list. */
export const buildMissingReasons = (flags: MissingReasonFlags): string[] => {
  const missingReasons: string[] = [];
  if (!flags.isPanNumberValid) missingReasons.push('Enter a valid PAN number (e.g., ABCDE1234F).');
  if (flags.isPanNumberValid && !flags.hasPanFrontDoc)
    missingReasons.push('Upload the PAN card front image.');
  if (!flags.isAadhaarNumberValid)
    missingReasons.push('Enter a valid 12-digit Aadhaar number.');
  if (flags.isAadhaarNumberValid && !flags.hasAadhaarFrontDoc)
    missingReasons.push('Upload the Aadhaar front image.');
  if (flags.isAadhaarNumberValid && !flags.hasAadhaarBackDoc)
    missingReasons.push('Upload the Aadhaar back image.');
  if (!flags.isAccountNumberValid)
    missingReasons.push('Enter a valid bank account number (6-20 digits).');
  if (flags.isAccountNumberValid && !flags.doAccountNumbersMatch)
    missingReasons.push("Account Number and Confirm Account Number don't match.");
  if (!flags.isIfscValid)
    missingReasons.push(
      'Enter a valid IFSC code (e.g., SBIN0001234 — 4 letters, then 0, then 6 characters).',
    );
  if (!flags.hasAccountHolderName) missingReasons.push("Enter the bank account holder's name.");
  if (!flags.hasBankName) missingReasons.push('Enter the bank name.');
  return missingReasons;
};

export const computeKycState = (
  status: string | undefined,
  remaining: number,
): KycState =>
  status === 'approved'
    ? 'approved'
    : status === 'rejected'
      ? 'rejected'
      : remaining === 0
        ? 'under_review'
        : 'incomplete';

export const computeReadinessHeadline = (kycState: KycState, remaining: number): string =>
  kycState === 'approved'
    ? 'KYC verified — payouts are enabled'
    : kycState === 'rejected'
      ? 'Your KYC was rejected — please review and resubmit'
      : kycState === 'under_review'
        ? 'All steps complete — under review by our team'
        : `Finish ${remaining} more step${remaining === 1 ? '' : 's'} to unlock payouts`;
