import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import Svg, {
  Defs,
  G,
  Path,
  Stop,
  Text as SvgText,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';

import {
  CalloutStrong,
  CalloutText,
  WebCallout,
  type CalloutTone,
} from '@components/history';
import { LoadFailed, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { queryKeys } from '@constants/queryKeys';
import { useBankAccount, useKyc } from '@hooks/useKyc';
import { kycApi } from '@services/api';
import { fontFamily, webColors, webGradients } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';
import { showPopupToast } from '@utils/toast';

/**
 * KYC & Payouts — a replica of the Artist Web's second Settings tab at mobile
 * widths, now FULLY interactive: editable fields, document image upload, live
 * validation, and a single combined Save.
 *
 * Web sources, read line-by-line and matched value-for-value:
 *   • `src/main.tsx` 1733–1800 — the `.creator-settings-page` shell.
 *   • `src/KycSettingsTab.tsx` 1–838 — the panel itself and, now, its full
 *     stateful behavior: prefill, validation primitives (lines 105–174),
 *     `handleSaveAll` (lines 397–435), and the missing-reasons + Save button.
 *   • `src/styles.css` — `.kyc-submit` (28069) and `.kyc-missing-reasons`
 *     (28095), plus the `.upload-thumb-*` rules (27819–27865).
 *
 * Data layer: `useKyc()` / `useBankAccount()` for reads; `kycApi` for writes
 * (uploadDocument + savePan/saveAadhaar/saveBankAccount); after a save the two
 * KYC query keys are invalidated so the screen refetches.
 */

/* -------------------------------------------------------------------------- */
/* .eyebrow — gradient-filled text                                             */
/* -------------------------------------------------------------------------- */

const SHIELD_CHECK_D =
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z';
const SHIELD_CHECK_TICK = 'm9 12 2 2 4-4';

/**
 * `.eyebrow` paints its text with `--premium-gradient` via
 * `background-clip: text`, which React Native cannot do on a `<Text>`; this
 * draws the same three stops (#FF3FAD 0%, #8C4DFF 52%, #34E7FF 100%, 135deg)
 * as an SVG fill instead. Inherited size is the 16px body default, weight 800,
 * icon 12px, gap 8px, margin-bottom 12px.
 */
const PayoutReadinessEyebrow = () => {
  const box = rf(20);
  const icon = rf(12);
  const scale = icon / 24;
  const dy = (box - icon) / 2;
  return (
    <Svg height={box} width={rf(200)} style={styles.eyebrow}>
      <Defs>
        <SvgLinearGradient id="premiumInk" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={webGradients.premium[0]} />
          <Stop offset="0.52" stopColor={webGradients.premium[1]} />
          <Stop offset="1" stopColor={webGradients.premium[2]} />
        </SvgLinearGradient>
      </Defs>
      <G transform={`translate(0 ${dy}) scale(${scale})`}>
        <Path
          d={SHIELD_CHECK_D}
          stroke="url(#premiumInk)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={SHIELD_CHECK_TICK}
          stroke="url(#premiumInk)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
      <SvgText
        x={icon + rf(8)}
        y={box - rf(5)}
        fill="url(#premiumInk)"
        fontFamily={fontFamily.extrabold}
        fontSize={rf(16)}
      >
        Payout readiness
      </SvgText>
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/* .kyc-stepper                                                                */
/* -------------------------------------------------------------------------- */

type Step = { key: string; label: string; done: boolean };

/**
 * `.kyc-step` + `.kyc-dot` + `.kyc-line`.
 *
 * Web sets `flex-wrap: wrap`, which drops Bank onto a second row at phone
 * width. Here the four steps stay on ONE row instead: the dots and connectors
 * hold their size and the labels take the squeeze, so a narrow screen ellipses
 * "Aadhaar" rather than breaking the run in half.
 */
const Stepper = ({ steps, firstPending }: { steps: Step[]; firstPending: number }) => (
  <View style={styles.stepper}>
    {steps.map((step, i) => {
      const current = !step.done && i === firstPending;
      return (
        <View key={step.key} style={styles.stepperRun}>
          <View style={styles.step}>
            <View
              style={[
                styles.dot,
                step.done ? styles.dotDone : null,
                current ? styles.dotCurrent : null,
              ]}
            >
              {step.done ? (
                <LucideIcon name="check" size={rf(12)} color={webColors.onGreenDeep} />
              ) : (
                <Text
                  style={[styles.dotNum, current ? styles.dotNumCurrent : null]}
                >{`${i + 1}`}</Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.stepLbl,
                step.done ? styles.stepLblDone : null,
                current ? styles.stepLblCurrent : null,
              ]}
            >
              {step.label}
            </Text>
          </View>
          {i < steps.length - 1 ? (
            <View style={[styles.line, step.done ? styles.lineDone : null]} />
          ) : null}
        </View>
      );
    })}
  </View>
);

/* -------------------------------------------------------------------------- */
/* .acc-item                                                                   */
/* -------------------------------------------------------------------------- */

/** `.acc-item.open` — every section renders expanded on the web. */
const AccItem = ({
  icon,
  title,
  done,
  children,
}: {
  icon: LucideIconName;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) => (
  <View style={styles.accItem}>
    <View style={styles.accHead}>
      <View style={styles.accHeadTitle}>
        <LucideIcon name={icon} size={rf(15)} color={webColors.purple} />
        <Text style={styles.accTitle}>{title}</Text>
      </View>
      <View style={[styles.accChip, done ? styles.accChipDone : null]}>
        <Text style={[styles.accChipText, done ? styles.accChipTextDone : null]}>
          {done ? '✓ Complete' : 'Not started'}
        </Text>
      </View>
    </View>
    <View style={styles.accBodyInner}>{children}</View>
  </View>
);

/** `.field` + `.field-input`, now an editable `<TextInput>` keeping the exact
 *  container styling. Values arrive masked from the API and are prefilled. */
const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  editable = true,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon?: LucideIconName;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldInput, editable ? null : styles.fieldInputDisabled]}>
      {icon ? <LucideIcon name={icon} size={rf(14)} color={webColors.dim} /> : null}
      <TextInput
        style={[styles.fieldValue, styles.fieldInputText]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={webColors.placeholderInk}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  </View>
);

/** `.field` with a `<select>` on the web — here a tap-to-open Modal picker that
 *  keeps the `.field-input` look. */
const AccountTypeField = ({
  value,
  onChange,
  editable,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const options = [
    { key: 'savings', label: 'Savings Account' },
    { key: 'current', label: 'Current Account' },
  ];
  const selected = options.find((o) => o.key === value) ?? options[0];
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Account Type</Text>
      <Pressable
        onPress={editable ? () => setOpen(true) : undefined}
        disabled={!editable}
        style={[styles.fieldInput, editable ? null : styles.fieldInputDisabled]}
      >
        <Text numberOfLines={1} style={styles.fieldValue}>
          {selected.label}
        </Text>
        <LucideIcon name="chevron-down" size={rf(16)} color={webColors.dim} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Account Type</Text>
            {options.map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.pickerRow}
                onPress={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                <Text
                  style={[styles.pickerRowText, opt.key === value ? styles.pickerRowTextActive : null]}
                >
                  {opt.label}
                </Text>
                {opt.key === value ? (
                  <LucideIcon name="check" size={rf(16)} color={webColors.purple} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

/**
 * `.upload-field` / `.upload-row` / `.btn-upload` — now interactive: tapping the
 * row opens the image picker. `hasDoc` reflects a freshly-picked file OR a
 * server-side document (and not removed), matching the web's `done`. When a
 * preview URI is available (local pick or a fetched view URL) a 75px thumbnail
 * with a remove (x) button renders below, mirroring `.upload-thumb-row`.
 */
const UploadRow = ({
  label,
  hasDoc,
  pickedName,
  previewUri,
  editable,
  onPick,
  onRemove,
}: {
  label: string;
  hasDoc: boolean;
  pickedName?: string | null;
  previewUri?: string | null;
  editable: boolean;
  onPick: () => void;
  onRemove: () => void;
}) => (
  <View style={styles.uploadField}>
    <View style={styles.uploadRow}>
      <View style={styles.uploadMeta}>
        <Text style={styles.uploadStrong}>{label}</Text>
        <Text style={styles.uploadSmall} numberOfLines={1}>
          {pickedName ? pickedName : hasDoc ? 'Document uploaded' : 'JPEG or PNG, max 5MB'}
        </Text>
      </View>
      <Pressable
        onPress={editable ? onPick : undefined}
        disabled={!editable}
        style={[
          styles.btnUpload,
          hasDoc ? styles.btnUploadDone : null,
          editable ? null : styles.btnUploadDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={hasDoc ? `Replace ${label}` : `Upload ${label}`}
      >
        <LucideIcon
          name={hasDoc ? 'check' : 'cloud-upload'}
          size={rf(12)}
          color={hasDoc ? webColors.green : webColors.uploadInk}
        />
        <Text style={[styles.btnUploadText, hasDoc ? styles.btnUploadTextDone : null]}>
          {hasDoc ? 'Uploaded' : 'Upload'}
        </Text>
      </Pressable>
    </View>
    {previewUri ? (
      <View style={styles.uploadThumbRow}>
        <View style={styles.uploadThumb}>
          <Image source={{ uri: previewUri }} style={styles.uploadThumbImg} contentFit="cover" />
          {editable ? (
            <Pressable
              style={styles.uploadThumbRemove}
              onPress={onRemove}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
            >
              <LucideIcon name="x" size={rf(12)} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    ) : null}
  </View>
);

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

type BankDetails = {
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
};

type SectionResult =
  | { label: string; ok: true }
  | { label: string; ok: false; message: string };

const KycPayoutsScreen = () => {
  const router = useRouter();
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
  // KycSettingsTab.tsx 114–174, ported 1:1.
  const isReadOnly = kyc?.status === 'approved' || kyc?.approvalStatus === 'approved';

  const hasPanFrontDoc = !!panFrontUri || (!!kyc?.panFrontUploaded && !panFrontRemoved);
  const hasAadhaarFrontDoc =
    !!aadhaarFrontUri || (!!kyc?.aadhaarFrontUploaded && !aadhaarFrontRemoved);
  const hasAadhaarBackDoc =
    !!aadhaarBackUri || (!!kyc?.aadhaarBackUploaded && !aadhaarBackRemoved);

  const panNumberUnchanged = !!kyc?.panNumber && panNumber === kyc.panNumber;
  const aadhaarNumberUnchanged = !!kyc?.aadhaarNumber && aadhaarNumber === kyc.aadhaarNumber;
  const accountNumberUnchanged =
    !!originalAccountNumber && bankDetails.accountNumber === originalAccountNumber;

  const isPanNumberValid =
    panNumberUnchanged || /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(panNumber);
  const isAadhaarNumberValid = aadhaarNumberUnchanged || /^\d{12}$/.test(aadhaarNumber);
  const isAccountNumberValid =
    accountNumberUnchanged || /^[0-9]{6,20}$/.test(bankDetails.accountNumber);
  const doAccountNumbersMatch =
    bankDetails.accountNumber === bankDetails.confirmAccountNumber;
  const isIfscValid = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bankDetails.ifscCode);
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

  const missingReasons: string[] = [];
  if (!isPanNumberValid) missingReasons.push('Enter a valid PAN number (e.g., ABCDE1234F).');
  if (isPanNumberValid && !hasPanFrontDoc)
    missingReasons.push('Upload the PAN card front image.');
  if (!isAadhaarNumberValid)
    missingReasons.push('Enter a valid 12-digit Aadhaar number.');
  if (isAadhaarNumberValid && !hasAadhaarFrontDoc)
    missingReasons.push('Upload the Aadhaar front image.');
  if (isAadhaarNumberValid && !hasAadhaarBackDoc)
    missingReasons.push('Upload the Aadhaar back image.');
  if (!isAccountNumberValid)
    missingReasons.push('Enter a valid bank account number (6-20 digits).');
  if (isAccountNumberValid && !doAccountNumbersMatch)
    missingReasons.push("Account Number and Confirm Account Number don't match.");
  if (!isIfscValid)
    missingReasons.push(
      'Enter a valid IFSC code (e.g., SBIN0001234 — 4 letters, then 0, then 6 characters).',
    );
  if (!hasAccountHolderName) missingReasons.push("Enter the bank account holder's name.");
  if (!hasBankName) missingReasons.push('Enter the bank name.');

  /* ----------------------------- stepper ------------------------------- */
  const steps: Step[] = [
    { key: 'profile', label: 'Profile', done: true },
    { key: 'pan', label: 'PAN', done: panDone },
    { key: 'aadhaar', label: 'Aadhaar', done: aadhaarDone },
    { key: 'bank', label: 'Bank', done: bankDone },
  ];
  const firstPending = steps.findIndex((s) => !s.done);
  const remaining = steps.filter((s) => !s.done).length;

  const kycState: 'approved' | 'rejected' | 'under_review' | 'incomplete' =
    kyc?.status === 'approved'
      ? 'approved'
      : kyc?.status === 'rejected'
        ? 'rejected'
        : remaining === 0
          ? 'under_review'
          : 'incomplete';

  const readinessHeadline =
    kycState === 'approved'
      ? 'KYC verified — payouts are enabled'
      : kycState === 'rejected'
        ? 'Your KYC was rejected — please review and resubmit'
        : kycState === 'under_review'
          ? 'All steps complete — under review by our team'
          : `Finish ${remaining} more step${remaining === 1 ? '' : 's'} to unlock payouts`;

  const stateCallout: { tone: CalloutTone; body: React.ReactNode } | null =
    kycState === 'approved'
      ? {
          tone: 'green',
          body: (
            <CalloutText>
              <CalloutStrong>Verified:</CalloutStrong> Your KYC has been approved by our team.
              Payouts to your bank account are enabled, and your details are locked as read-only
              for compliance.
            </CalloutText>
          ),
        }
      : kycState === 'rejected'
        ? {
            tone: 'red',
            body: (
              <>
                <CalloutText>
                  <CalloutStrong>Rejected:</CalloutStrong>{' '}
                  {kyc?.rejectionReason || 'Our team found an issue with your submission.'} Please
                  review and resubmit the affected section(s) below.
                </CalloutText>
                {kyc?.adminMessage ? (
                  <View style={styles.calloutSecondPara}>
                    <CalloutText>{kyc.adminMessage}</CalloutText>
                  </View>
                ) : null}
              </>
            ),
          }
        : kycState === 'under_review'
          ? {
              tone: 'gold',
              body: (
                <CalloutText>
                  <CalloutStrong>Under review:</CalloutStrong> All sections are complete and your
                  KYC has been sent for verification. We&apos;ll notify you once our team has
                  reviewed it — usually within 24–48 hours.
                </CalloutText>
              ),
            }
          : {
              tone: 'gold',
              body: (
                <>
                  <CalloutText>
                    <CalloutStrong>Why we ask for this:</CalloutStrong> Indian payment regulations
                    require verified identity and bank details before we can release creator
                    earnings to a bank account. Tap a section below to expand it.
                  </CalloutText>
                  <View style={styles.calloutSecondPara}>
                    <CalloutText>
                      Verification is usually reviewed within 24–48 hours. Your documents are
                      encrypted and only used for payout compliance — never shown on your public
                      profile.
                    </CalloutText>
                  </View>
                </>
              ),
            };

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

  return (
    <View style={styles.root}>
      <Screen tabBarSpacing scrollable padded={false} contentContainerStyle={styles.content}>
        {/* `.page-head` — the web reaches this panel through the Settings
            page's tab rail; in the app it is its own route off the Me tab, so
            the head carries this screen's own title and there is no tab bar. */}
        <View style={styles.pageHead}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <LucideIcon name="arrow-left" size={rf(18)} color={webColors.textStrong} />
          </Pressable>
          <View style={styles.headText}>
            <Text style={styles.h1}>KYC &amp; Payouts</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.panel}>
            <Skeleton width={160} height={16} round={8} />
            <Skeleton width={260} height={22} round={11} />
            <Skeleton height={30} round={15} />
            <Skeleton height={86} round={12} />
            <Skeleton height={240} round={18} />
            <Skeleton height={240} round={18} />
          </View>
        ) : error ? (
          <LoadFailed
            message={getErrorMessage(error)}
            onRetry={() => void refetch()}
            isRetrying={isRefetching}
          />
        ) : (
          <View style={styles.panel}>
            {/* .priority-card — unstyled inside .creator-settings-page: the
                eyebrow, the headline and the stepper sit directly on the page. */}
            <View>
              <PayoutReadinessEyebrow />
              <Text style={styles.big}>{readinessHeadline}</Text>
              <Stepper steps={steps} firstPending={firstPending} />
            </View>

            {stateCallout ? (
              <WebCallout tone={stateCallout.tone} icon="shield-check">
                {stateCallout.body}
              </WebCallout>
            ) : null}

            {/* .kyc-two-col-row — one column at ≤900px */}
            <AccItem icon="file-text" title="PAN Card Details" done={panDone}>
              <View style={styles.bodyCallout}>
                <WebCallout icon="credit-card">
                  <CalloutText>
                    Your <CalloutStrong>Permanent Account Number</CalloutStrong> is used for tax
                    reporting on creator earnings above the annual threshold. Enter it exactly as
                    printed — 5 letters, 4 digits, 1 letter (e.g.{' '}
                    <CalloutStrong>ABCDE1234F</CalloutStrong>) — and upload a clear photo of the
                    front of the card.
                  </CalloutText>
                </WebCallout>
              </View>
              <Field
                label="PAN Number"
                value={panNumber}
                onChangeText={(v) => setPanNumber(v.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                editable={!isReadOnly}
                maxLength={10}
                autoCapitalize="characters"
              />
              <UploadRow
                label="PAN Card Front Image"
                hasDoc={hasPanFrontDoc}
                pickedName={panFrontUri ? 'New image selected' : null}
                previewUri={panFrontUri ?? (panFrontRemoved ? null : panFrontViewUrl)}
                editable={!isReadOnly}
                onPick={() => void pickImage(setPanFrontUri, setPanFrontRemoved)}
                onRemove={() => {
                  setPanFrontUri(null);
                  setPanFrontViewUrl(null);
                  setPanFrontRemoved(true);
                }}
              />
            </AccItem>

            <AccItem icon="file-text" title="Aadhaar Card Details" done={aadhaarDone}>
              <View style={styles.bodyCallout}>
                <WebCallout icon="hash">
                  <CalloutText>
                    Aadhaar confirms your identity matches the name on your bank account. We need{' '}
                    <CalloutStrong>both sides</CalloutStrong> of the card — the front has your
                    photo and number, the back has your address for record-keeping.
                  </CalloutText>
                </WebCallout>
              </View>
              <Field
                label="12-digit Aadhaar Number"
                value={aadhaarNumber}
                onChangeText={(v) => setAadhaarNumber(v.replace(/\D/g, ''))}
                placeholder="12-digit Aadhaar Number"
                editable={!isReadOnly}
                keyboardType="number-pad"
                maxLength={12}
              />
              <UploadRow
                label="Aadhaar Front Image"
                hasDoc={hasAadhaarFrontDoc}
                pickedName={aadhaarFrontUri ? 'New image selected' : null}
                previewUri={aadhaarFrontUri ?? (aadhaarFrontRemoved ? null : aadhaarFrontViewUrl)}
                editable={!isReadOnly}
                onPick={() => void pickImage(setAadhaarFrontUri, setAadhaarFrontRemoved)}
                onRemove={() => {
                  setAadhaarFrontUri(null);
                  setAadhaarFrontViewUrl(null);
                  setAadhaarFrontRemoved(true);
                }}
              />
              <UploadRow
                label="Aadhaar Back Image"
                hasDoc={hasAadhaarBackDoc}
                pickedName={aadhaarBackUri ? 'New image selected' : null}
                previewUri={aadhaarBackUri ?? (aadhaarBackRemoved ? null : aadhaarBackViewUrl)}
                editable={!isReadOnly}
                onPick={() => void pickImage(setAadhaarBackUri, setAadhaarBackRemoved)}
                onRemove={() => {
                  setAadhaarBackUri(null);
                  setAadhaarBackViewUrl(null);
                  setAadhaarBackRemoved(true);
                }}
              />
            </AccItem>

            <AccItem icon="landmark" title="Bank Account Details" done={bankDone}>
              <View style={styles.bodyCallout}>
                <WebCallout tone="green" icon="landmark">
                  <CalloutText>
                    <CalloutStrong>Where payouts land:</CalloutStrong> withdrawals are sent here
                    once KYC is verified. The account holder name must match your PAN and Aadhaar
                    exactly, or the transfer will be rejected by your bank. Double-check the
                    account number before saving — we ask you to confirm it below to catch typos.
                  </CalloutText>
                </WebCallout>
              </View>

              <View style={styles.fieldRow2}>
                <View style={styles.fieldCol}>
                  <Field
                    label="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChangeText={(v) => setBankField('accountHolderName', v)}
                    placeholder="e.g. John Doe"
                    icon="user"
                    editable={!isReadOnly}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Field
                    label="Account Number"
                    value={bankDetails.accountNumber}
                    onChangeText={(v) => setBankField('accountNumber', v.replace(/\D/g, ''))}
                    placeholder="6-20 digits"
                    icon="hash"
                    editable={!isReadOnly}
                    keyboardType="number-pad"
                    maxLength={20}
                  />
                </View>
              </View>

              <View style={styles.fieldRow2}>
                <View style={styles.fieldCol}>
                  <Field
                    label="Confirm Account Number"
                    value={bankDetails.confirmAccountNumber}
                    onChangeText={(v) =>
                      setBankField('confirmAccountNumber', v.replace(/\D/g, ''))
                    }
                    placeholder="Confirm Account Number"
                    icon="circle-check"
                    editable={!isReadOnly}
                    keyboardType="number-pad"
                    maxLength={20}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Field
                    label="IFSC Code"
                    value={bankDetails.ifscCode}
                    onChangeText={(v) => setBankField('ifscCode', v.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    icon="building"
                    editable={!isReadOnly}
                    maxLength={11}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.fieldRow2}>
                <View style={styles.fieldCol}>
                  <Field
                    label="Bank Name"
                    value={bankDetails.bankName}
                    onChangeText={(v) => setBankField('bankName', v)}
                    placeholder="e.g. State Bank of India"
                    icon="landmark"
                    editable={!isReadOnly}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Field
                    label="Branch Name"
                    value={bankDetails.branchName}
                    onChangeText={(v) => setBankField('branchName', v)}
                    placeholder="e.g. Main Branch"
                    icon="map-pin"
                    editable={!isReadOnly}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* `.field` with an inline `max-width: 260` on the web */}
              <View style={styles.accountTypeField}>
                <AccountTypeField
                  value={bankDetails.accountType}
                  onChange={(v) => setBankField('accountType', v)}
                  editable={!isReadOnly}
                />
              </View>
            </AccItem>

            {!isReadOnly && !allFieldsValid && missingReasons.length > 0 ? (
              <View style={styles.missingReasons}>
                <Text style={styles.missingTitle}>Before you can save, please fix:</Text>
                {missingReasons.map((reason) => (
                  <View key={reason} style={styles.missingItem}>
                    <Text style={styles.missingBullet}>•</Text>
                    <Text style={styles.missingText}>{reason}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {!isReadOnly ? (
              <Pressable
                onPress={handleSaveAll}
                disabled={saving || !allFieldsValid}
                style={[styles.submit, saving || !allFieldsValid ? styles.submitDisabled : null]}
                accessibilityRole="button"
                accessibilityLabel="Save KYC details"
              >
                <LinearGradient
                  colors={[webColors.pinkHot, webColors.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitFill}
                >
                  <Text style={styles.submitText}>{saving ? 'Saving…' : 'Save'}</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        )}
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** `.creator-main { padding: 12px }` at ≤768px; `.creator-view { gap: 20px }`. */
  content: {
    gap: 20,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  /** `.tab-panel { display: flex; flex-direction: column; gap: 16px }`, and
   *  `KycSettingsTab`'s own root is `flex column; gap: 16` too. */
  panel: {
    gap: 16,
  },

  /* .page-head ------------------------------------------------------------ */
  pageHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  /** `.creator-settings-back` — 36px circle, shown only at ≤768px. */
  backBtn: {
    alignItems: 'center',
    backgroundColor: webColors.chip,
    borderColor: webColors.circleBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headText: {
    flex: 1,
  },
  h1: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(22),
    letterSpacing: -0.22,
    lineHeight: rf(27),
  },

  /* .priority-card (no box styling on this page) -------------------------- */
  /** `.eyebrow { margin-bottom: 12px }`. */
  eyebrow: {
    marginBottom: 12,
  },
  /** `p.big` is unstyled here, so it is a plain paragraph: inherited 16px,
   *  `line-height: 1.55`, default `margin-bottom: 1em`. */
  big: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(16),
    lineHeight: rf(24.8),
    marginBottom: 16,
  },

  /* .kyc-stepper ---------------------------------------------------------- */
  /** One row, never wrapped — see the `Stepper` note above. */
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  /** `minWidth: 0` is what lets the label inside actually shrink. */
  stepperRun: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    minWidth: 0,
  },
  step: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 7,
    minWidth: 0,
  },
  /** 26 rather than web's 30: four dots plus four labels have to fit a phone. */
  dot: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 13,
    borderWidth: 2,
    flexShrink: 0,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  dotDone: {
    backgroundColor: webColors.green,
    borderColor: webColors.green,
  },
  dotCurrent: {
    backgroundColor: webColors.gold,
    borderColor: webColors.gold,
  },
  dotNum: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(12),
    lineHeight: rf(15),
  },
  dotNumCurrent: {
    color: webColors.onGoldDeep,
  },
  /** The only elastic part of the row: it gives width back to the connectors. */
  stepLbl: {
    color: webColors.muted,
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
  },
  stepLblDone: {
    color: webColors.green,
  },
  stepLblCurrent: {
    color: webColors.gold,
  },
  /**
   * `.kyc-line { width: 34px; height: 2px; margin: 0 8px }` — shortened to 14
   * with 5px margins, because at web's 34+16 the three connectors alone eat
   * 150px of a ~330px row and there is nothing left for the labels.
   */
  line: {
    backgroundColor: webColors.panelBorder,
    flexShrink: 0,
    height: 2,
    marginHorizontal: 5,
    width: 14,
  },
  lineDone: {
    backgroundColor: webColors.green,
  },

  /** `.info-callout p + p { margin-top: 6px }`. */
  calloutSecondPara: {
    marginTop: 6,
  },

  /* .acc-item -------------------------------------------------------------- */
  accItem: {
    backgroundColor: webColors.surface,
    borderColor: webColors.panelBorder,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  accHeadTitle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  accTitle: {
    color: webColors.textStrong,
    flexShrink: 1,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
  accChip: {
    backgroundColor: webColors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  accChipDone: {
    backgroundColor: webColors.greenPill,
  },
  accChipText: {
    color: webColors.dim,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(10),
    lineHeight: rf(13),
  },
  accChipTextDone: {
    color: webColors.green,
  },
  accBodyInner: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  /** `.creator-settings-page .info-callout { margin: 2px 0 16px }`. */
  bodyCallout: {
    marginBottom: 16,
    marginTop: 2,
  },

  /* .field ----------------------------------------------------------------- */
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: webColors.muted,
    fontFamily: fontFamily.bold,
    fontSize: rf(11),
    lineHeight: rf(15),
    marginBottom: 5,
  },
  fieldInput: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  /** `disabled` inputs on the web dim to 0.7 opacity. */
  fieldInputDisabled: {
    opacity: 0.7,
  },
  fieldValue: {
    color: webColors.textStrong,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(19),
  },
  /** Strip the platform's default TextInput chrome so it sits like the web's
   *  bare `<input>` inside the shared `.field-input` box. */
  fieldInputText: {
    padding: 0,
  },
  fieldPlaceholder: {
    color: webColors.placeholderInk,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(12.5),
    lineHeight: rf(19),
  },
  /** `.field-row2 { grid-template-columns: 1fr 1fr; gap: 10px }` — no mobile
   *  override on the web, so the pair stays side by side here too. */
  fieldRow2: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldCol: {
    flex: 1,
    minWidth: 0,
  },
  /** Inline `style={{ maxWidth: 260 }}` on the web. */
  accountTypeField: {
    maxWidth: 260,
  },

  /* Account-type picker modal (matches edit-profile's picker) ------------- */
  pickerScrim: {
    backgroundColor: webColors.scrim,
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: webColors.innerCard,
    borderColor: webColors.panelBorder,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pickerTitle: {
    color: webColors.textStrong,
    fontFamily: fontFamily.extrabold,
    fontSize: rf(15),
    marginBottom: 12,
  },
  pickerRow: {
    alignItems: 'center',
    borderBottomColor: webColors.panelBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  pickerRowText: {
    color: webColors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: rf(14),
  },
  pickerRowTextActive: {
    color: webColors.purple,
    fontFamily: fontFamily.bold,
  },

  /* .upload-field ---------------------------------------------------------- */
  uploadField: {
    marginBottom: 10,
  },
  uploadRow: {
    alignItems: 'center',
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  uploadMeta: {
    flex: 1,
    minWidth: 0,
  },
  uploadStrong: {
    color: webColors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: rf(12.5),
    lineHeight: rf(19),
  },
  uploadSmall: {
    color: webColors.dim,
    fontFamily: fontFamily.regular,
    fontSize: rf(10.5),
    lineHeight: rf(16),
  },
  btnUpload: {
    alignItems: 'center',
    backgroundColor: webColors.uploadFill,
    borderColor: webColors.uploadBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnUploadDone: {
    backgroundColor: webColors.greenPill,
    borderColor: webColors.greenChipBorder,
  },
  btnUploadDisabled: {
    opacity: 0.6,
  },
  btnUploadText: {
    color: webColors.uploadInk,
    fontFamily: fontFamily.bold,
    fontSize: rf(11.5),
    lineHeight: rf(15),
  },
  btnUploadTextDone: {
    color: webColors.green,
  },

  /* .upload-thumb-row / .upload-thumb-sm / .upload-thumb-remove ----------- */
  uploadThumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
    marginTop: 8,
  },
  uploadThumb: {
    backgroundColor: webColors.surfaceStrong,
    borderColor: webColors.panelBorder,
    borderRadius: 10,
    borderWidth: 1,
    height: 75,
    overflow: 'hidden',
    width: 75,
  },
  uploadThumbImg: {
    height: '100%',
    width: '100%',
  },
  uploadThumbRemove: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 3,
    top: 3,
    width: 18,
  },

  /* .kyc-missing-reasons -------------------------------------------------- */
  missingReasons: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  missingTitle: {
    color: '#EF4444',
    fontFamily: fontFamily.extrabold,
    fontSize: rf(13),
    lineHeight: rf(18),
    marginBottom: 8,
  },
  missingItem: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 3,
  },
  missingBullet: {
    color: '#FCA5A5',
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(18),
  },
  missingText: {
    color: '#FCA5A5',
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: rf(13),
    lineHeight: rf(18),
  },

  /* .kyc-submit ----------------------------------------------------------- */
  submit: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitFill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 15,
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.extrabold,
    fontSize: rf(14),
    lineHeight: rf(19),
  },
});

export default KycPayoutsScreen;
