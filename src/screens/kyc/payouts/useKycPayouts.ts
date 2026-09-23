import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { useBankAccount, useKyc } from '@hooks/useKyc';
import { kycApi } from '@services/api';
import { getErrorMessage } from '@utils/errorHandler';
import { showPopupToast } from '@utils/toast';

import {
  buildMissingReasons,
  computeKycState,
  computeReadinessHeadline,
  doAccountNumbersMatch as computeDoAccountNumbersMatch,
  isAadhaarNumberValid as computeIsAadhaarNumberValid,
  isAccountNumberValid as computeIsAccountNumberValid,
  isIfscValid as computeIsIfscValid,
  isPanNumberValid as computeIsPanNumberValid,
  isReadOnlyKyc,
} from './schema';
import type { BankDetails, SectionResult, Step, UseKycPayoutsResult } from './types';

/** All KYC & Payouts screen logic. The screen component renders state; it
 *  holds none. */
export const useKycPayouts = (): UseKycPayoutsResult => {
  const queryClient = useQueryClient();
  const { data: kyc, isLoading, error, refetch, isRefetching } = useKyc();
  const { data: bank } = useBankAccount();

  /**
   * Approval happens on the admin's side, not the artist's, so nothing in the
   * app invalidates this — `useKyc` just kept serving its 60s-stale cache and
   * the page still read "under review" long after the admin had approved it.
   * Refetching on focus is what makes coming back to this screen show the
   * server's current answer.
   */
  useFocusEffect(
    useCallback(() => {
      void refetch();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.kyc.bankAccount(),
      });
    }, [queryClient, refetch]),
  );

  /* ------------------------------ form state --------------------------- */
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'savings',
  });
  const [originalAccountNumber, setOriginalAccountNumber] = useState('');

  const [panFrontUri, setPanFrontUri] = useState<string | null>(null);
  const [aadhaarFrontUri, setAadhaarFrontUri] = useState<string | null>(null);
  const [aadhaarBackUri, setAadhaarBackUri] = useState<string | null>(null);
  const [panFrontRemoved, setPanFrontRemoved] = useState(false);
  const [aadhaarFrontRemoved, setAadhaarFrontRemoved] = useState(false);
  const [aadhaarBackRemoved, setAadhaarBackRemoved] = useState(false);

  // Signed view URLs for already-uploaded documents, so the thumbnail can
  // render inline (mirrors the web's getViewUrl effects). A locally-picked
  // file takes precedence and is a better instant preview.
  const [panFrontViewUrl, setPanFrontViewUrl] = useState<string | null>(null);
  const [aadhaarFrontViewUrl, setAadhaarFrontViewUrl] = useState<string | null>(null);
  const [aadhaarBackViewUrl, setAadhaarBackViewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  /* ------------------------------ prefill ------------------------------ */
  // Masked PAN/Aadhaar come back from GET /kyc; prefill so an unchanged value
  // counts as valid. Keyed on the masked string, so a background refetch (same
  // value) won't clobber the artist's live typing — only a post-save change does.
  useEffect(() => {
    if (kyc?.panNumber) setPanNumber(kyc.panNumber);
  }, [kyc?.panNumber]);
  useEffect(() => {
    if (kyc?.aadhaarNumber) setAadhaarNumber(kyc.aadhaarNumber);
  }, [kyc?.aadhaarNumber]);

  useEffect(() => {
    if (!bank) return;
    setBankDetails({
      accountHolderName: bank.accountHolderName ?? '',
      accountNumber: bank.accountNumber ?? '',
      confirmAccountNumber: bank.accountNumber ?? '',
      ifscCode: bank.ifscCode ?? '',
      bankName: bank.bankName ?? '',
      branchName: bank.branchName ?? '',
      accountType: bank.accountType?.toLowerCase() ?? 'savings',
    });
    setOriginalAccountNumber(bank.accountNumber ?? '');
  }, [bank]);

  // Fetch signed view URLs for documents that are on file server-side and have
  // no fresher local pick — mirrors KycSettingsTab.tsx 58–92.
  useEffect(() => {
    if (kyc?.panFrontUploaded && !panFrontUri) {
      void kycApi.getViewUrl('pan_front').then((r) => {
        if (r.success && r.data) setPanFrontViewUrl(r.data);
      });
    }
  }, [kyc?.panFrontUploaded, panFrontUri]);
  useEffect(() => {
    if (kyc?.aadhaarFrontUploaded && !aadhaarFrontUri) {
      void kycApi.getViewUrl('aadhaar_front').then((r) => {
        if (r.success && r.data) setAadhaarFrontViewUrl(r.data);
      });
    }
  }, [kyc?.aadhaarFrontUploaded, aadhaarFrontUri]);
  useEffect(() => {
    if (kyc?.aadhaarBackUploaded && !aadhaarBackUri) {
      void kycApi.getViewUrl('aadhaar_back').then((r) => {
        if (r.success && r.data) setAadhaarBackViewUrl(r.data);
      });
    }
  }, [kyc?.aadhaarBackUploaded, aadhaarBackUri]);

  /* -------------------------- validity primitives ---------------------- */
  const isReadOnly = isReadOnlyKyc(kyc?.status, kyc?.approvalStatus ?? undefined);

  const hasPanFrontDoc = !!panFrontUri || (!!kyc?.panFrontUploaded && !panFrontRemoved);
  const hasAadhaarFrontDoc =
    !!aadhaarFrontUri || (!!kyc?.aadhaarFrontUploaded && !aadhaarFrontRemoved);
  const hasAadhaarBackDoc =
    !!aadhaarBackUri || (!!kyc?.aadhaarBackUploaded && !aadhaarBackRemoved);

  const panNumberUnchanged = !!kyc?.panNumber && panNumber === kyc.panNumber;
  const aadhaarNumberUnchanged = !!kyc?.aadhaarNumber && aadhaarNumber === kyc.aadhaarNumber;
  const accountNumberUnchanged =
    !!originalAccountNumber && bankDetails.accountNumber === originalAccountNumber;

  const isPanNumberValid = computeIsPanNumberValid(panNumber, panNumberUnchanged);
  const isAadhaarNumberValid = computeIsAadhaarNumberValid(aadhaarNumber, aadhaarNumberUnchanged);
  const isAccountNumberValid = computeIsAccountNumberValid(
    bankDetails.accountNumber,
    accountNumberUnchanged,
  );
  const doAccountNumbersMatch = computeDoAccountNumbersMatch(
    bankDetails.accountNumber,
    bankDetails.confirmAccountNumber,
  );
  const isIfscValid = computeIsIfscValid(bankDetails.ifscCode);
  const hasAccountHolderName = !!bankDetails.accountHolderName.trim();
  const hasBankName = !!bankDetails.bankName.trim();

  const panDone = isPanNumberValid && hasPanFrontDoc;
  const aadhaarDone = isAadhaarNumberValid && hasAadhaarFrontDoc && hasAadhaarBackDoc;
  const bankDone = bankDetails.accountHolderName.trim().length > 0;

  const allFieldsValid =
    isPanNumberValid &&
    hasPanFrontDoc &&
    isAadhaarNumberValid &&
    hasAadhaarFrontDoc &&
    hasAadhaarBackDoc &&
    isAccountNumberValid &&
    doAccountNumbersMatch &&
    isIfscValid &&
    hasAccountHolderName &&
    hasBankName;

  const missingReasons = buildMissingReasons({
    isPanNumberValid,
    hasPanFrontDoc,
    isAadhaarNumberValid,
    hasAadhaarFrontDoc,
    hasAadhaarBackDoc,
    isAccountNumberValid,
    doAccountNumbersMatch,
    isIfscValid,
    hasAccountHolderName,
    hasBankName,
  });

  /* ----------------------------- stepper ------------------------------- */
  const steps: Step[] = [
    { key: 'profile', label: 'Profile', done: true },
    { key: 'pan', label: 'PAN', done: panDone },
    { key: 'aadhaar', label: 'Aadhaar', done: aadhaarDone },
    { key: 'bank', label: 'Bank', done: bankDone },
  ];
  const firstPending = steps.findIndex((s) => !s.done);
  const remaining = steps.filter((s) => !s.done).length;

  const kycState = computeKycState(kyc?.status, remaining);
  const readinessHeadline = computeReadinessHeadline(kycState, remaining);

  /* ------------------------------ handlers ----------------------------- */
  const pickImage = async (
    setUri: (v: string) => void,
    setRemoved: (v: boolean) => void,
  ) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPopupToast(
        'Photo access is off. Turn it on in Settings to upload documents.',
        'error',
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    setUri(picked.assets[0].uri);
    setRemoved(false);
  };

  const setBankField = (key: keyof BankDetails, value: string) =>
    setBankDetails((prev) => ({ ...prev, [key]: value }));

  const handleSaveAll = async () => {
    if (!allFieldsValid) {
      showPopupToast(
        'Please correctly fill out all PAN, Aadhaar, and Bank details before saving.',
        'error',
      );
      return;
    }

    setSaving(true);
    try {
      // Each section saves independently — one failing doesn't stop the others.
      // Newly-picked documents are uploaded first to obtain their keys.
      const results = await Promise.all<SectionResult>([
        (async (): Promise<SectionResult> => {
          let panFrontKey: string | undefined;
          if (panFrontUri) {
            const up = await kycApi.uploadDocument(panFrontUri, 'pan_front');
            if (!up.success) return { label: 'PAN', ok: false, message: up.error };
            panFrontKey = up.data;
          }
          const r = await kycApi.savePan({ panNumber: panNumber.toUpperCase(), panFrontKey });
          return r.success ? { label: 'PAN', ok: true } : { label: 'PAN', ok: false, message: r.error };
        })(),
        (async (): Promise<SectionResult> => {
          let aadhaarFrontKey: string | undefined;
          let aadhaarBackKey: string | undefined;
          if (aadhaarFrontUri) {
            const up = await kycApi.uploadDocument(aadhaarFrontUri, 'aadhaar_front');
            if (!up.success) return { label: 'Aadhaar', ok: false, message: up.error };
            aadhaarFrontKey = up.data;
          }
          if (aadhaarBackUri) {
            const up = await kycApi.uploadDocument(aadhaarBackUri, 'aadhaar_back');
            if (!up.success) return { label: 'Aadhaar', ok: false, message: up.error };
            aadhaarBackKey = up.data;
          }
          const r = await kycApi.saveAadhaar({ aadhaarNumber, aadhaarFrontKey, aadhaarBackKey });
          return r.success
            ? { label: 'Aadhaar', ok: true }
            : { label: 'Aadhaar', ok: false, message: r.error };
        })(),
        (async (): Promise<SectionResult> => {
          const r = await kycApi.saveBankAccount({
            ...bankDetails,
            ifscCode: bankDetails.ifscCode.toUpperCase(),
          });
          return r.success ? { label: 'Bank', ok: true } : { label: 'Bank', ok: false, message: r.error };
        })(),
      ]);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.kyc.status() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.kyc.bankAccount() }),
      ]);

      const failures = results.filter(
        (r): r is Extract<SectionResult, { ok: false }> => !r.ok,
      );
      if (failures.length === 0) {
        showPopupToast('KYC details saved.', 'success');
      } else {
        failures.forEach((f) => showPopupToast(`${f.label}: ${f.message}`, 'error'));
      }
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    kyc,
    bank,
    isLoading,
    error,
    isRefetching,
    refetch: () => void refetch(),

    panNumber,
    setPanNumber,
    aadhaarNumber,
    setAadhaarNumber,
    bankDetails,
    setBankField,

    panFrontUri,
    aadhaarFrontUri,
    aadhaarBackUri,
    panFrontRemoved,
    aadhaarFrontRemoved,
    aadhaarBackRemoved,
    panFrontViewUrl,
    aadhaarFrontViewUrl,
    aadhaarBackViewUrl,

    handlePickPanFront: () => void pickImage(setPanFrontUri, setPanFrontRemoved),
    handleRemovePanFront: () => {
      setPanFrontUri(null);
      setPanFrontViewUrl(null);
      setPanFrontRemoved(true);
    },
    handlePickAadhaarFront: () => void pickImage(setAadhaarFrontUri, setAadhaarFrontRemoved),
    handleRemoveAadhaarFront: () => {
      setAadhaarFrontUri(null);
      setAadhaarFrontViewUrl(null);
      setAadhaarFrontRemoved(true);
    },
    handlePickAadhaarBack: () => void pickImage(setAadhaarBackUri, setAadhaarBackRemoved),
    handleRemoveAadhaarBack: () => {
      setAadhaarBackUri(null);
      setAadhaarBackViewUrl(null);
      setAadhaarBackRemoved(true);
    },

    isReadOnly,
    hasPanFrontDoc,
    hasAadhaarFrontDoc,
    hasAadhaarBackDoc,

    isPanNumberValid,
    isAadhaarNumberValid,
    isAccountNumberValid,
    doAccountNumbersMatch,
    isIfscValid,
    hasAccountHolderName,
    hasBankName,

    panDone,
    aadhaarDone,
    bankDone,
    allFieldsValid,
    missingReasons,

    steps,
    firstPending,
    remaining,
    kycState,
    readinessHeadline,

    saving,
    handleSaveAll: () => void handleSaveAll(),
  };
};
