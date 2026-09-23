import type { Dispatch, SetStateAction } from 'react';

import type { BankAccount, KycStatus } from '@app-types/api';

export type BankDetails = {
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
};

export type SectionResult =
  | { label: string; ok: true }
  | { label: string; ok: false; message: string };

export type Step = { key: string; label: string; done: boolean };

export type KycState = 'approved' | 'rejected' | 'under_review' | 'incomplete';

/** `.field` with a `<select>` on the web — lifted out of `AccountTypeField` so
 *  the options list is a single source of truth. */
export const ACCOUNT_TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: 'savings', label: 'Savings Account' },
  { key: 'current', label: 'Current Account' },
];

/** Flags `buildMissingReasons` needs to produce the exact same ordered list of
 *  user-facing messages the screen used to build inline. */
export interface MissingReasonFlags {
  isPanNumberValid: boolean;
  hasPanFrontDoc: boolean;
  isAadhaarNumberValid: boolean;
  hasAadhaarFrontDoc: boolean;
  hasAadhaarBackDoc: boolean;
  isAccountNumberValid: boolean;
  doAccountNumbersMatch: boolean;
  isIfscValid: boolean;
  hasAccountHolderName: boolean;
  hasBankName: boolean;
}

export interface UseKycPayoutsResult {
  kyc: KycStatus | undefined;
  bank: BankAccount | null | undefined;
  isLoading: boolean;
  error: Error | null;
  isRefetching: boolean;
  refetch: () => void;

  panNumber: string;
  setPanNumber: Dispatch<SetStateAction<string>>;
  aadhaarNumber: string;
  setAadhaarNumber: Dispatch<SetStateAction<string>>;
  bankDetails: BankDetails;
  setBankField: (key: keyof BankDetails, value: string) => void;

  panFrontUri: string | null;
  aadhaarFrontUri: string | null;
  aadhaarBackUri: string | null;
  panFrontRemoved: boolean;
  aadhaarFrontRemoved: boolean;
  aadhaarBackRemoved: boolean;
  panFrontViewUrl: string | null;
  aadhaarFrontViewUrl: string | null;
  aadhaarBackViewUrl: string | null;

  handlePickPanFront: () => void;
  handleRemovePanFront: () => void;
  handlePickAadhaarFront: () => void;
  handleRemoveAadhaarFront: () => void;
  handlePickAadhaarBack: () => void;
  handleRemoveAadhaarBack: () => void;

  isReadOnly: boolean;
  hasPanFrontDoc: boolean;
  hasAadhaarFrontDoc: boolean;
  hasAadhaarBackDoc: boolean;

  isPanNumberValid: boolean;
  isAadhaarNumberValid: boolean;
  isAccountNumberValid: boolean;
  doAccountNumbersMatch: boolean;
  isIfscValid: boolean;
  hasAccountHolderName: boolean;
  hasBankName: boolean;

  panDone: boolean;
  aadhaarDone: boolean;
  bankDone: boolean;
  allFieldsValid: boolean;
  missingReasons: string[];

  steps: Step[];
  firstPending: number;
  remaining: number;
  kycState: KycState;
  readinessHeadline: string;

  saving: boolean;
  handleSaveAll: () => void;
}
