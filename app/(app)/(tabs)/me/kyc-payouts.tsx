import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CalloutStrong, CalloutText, WebCallout } from '@components/history';
import { LoadFailed, Screen, Skeleton } from '@components/shared';
import { LucideIcon, Text } from '@components/ui';
import { webColors } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';

import { AccItem } from '@screens/kyc/payouts/components/AccItem';
import { AccountTypeField } from '@screens/kyc/payouts/components/AccountTypeField';
import { Field } from '@screens/kyc/payouts/components/Field';
import { PayoutReadinessEyebrow } from '@screens/kyc/payouts/components/PayoutReadinessEyebrow';
import { StateCallout } from '@screens/kyc/payouts/components/StateCallout';
import { Stepper } from '@screens/kyc/payouts/components/Stepper';
import { UploadRow } from '@screens/kyc/payouts/components/UploadRow';
import { styles } from '@screens/kyc/payouts/styles';
import { useKycPayouts } from '@screens/kyc/payouts/useKycPayouts';

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
const KycPayoutsScreen = () => {
  const router = useRouter();
  const {
    kyc,
    isLoading,
    error,
    refetch,
    isRefetching,

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

    handlePickPanFront,
    handleRemovePanFront,
    handlePickAadhaarFront,
    handleRemoveAadhaarFront,
    handlePickAadhaarBack,
    handleRemoveAadhaarBack,

    isReadOnly,
    hasPanFrontDoc,
    hasAadhaarFrontDoc,
    hasAadhaarBackDoc,

    panDone,
    aadhaarDone,
    bankDone,
    allFieldsValid,
    missingReasons,

    steps,
    firstPending,
    kycState,
    readinessHeadline,

    saving,
    handleSaveAll,
  } = useKycPayouts();

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
            onRetry={refetch}
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

            <StateCallout
              kycState={kycState}
              rejectionReason={kyc?.rejectionReason}
              adminMessage={kyc?.adminMessage}
            />

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
                onPick={handlePickPanFront}
                onRemove={handleRemovePanFront}
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
                onPick={handlePickAadhaarFront}
                onRemove={handleRemoveAadhaarFront}
              />
              <UploadRow
                label="Aadhaar Back Image"
                hasDoc={hasAadhaarBackDoc}
                pickedName={aadhaarBackUri ? 'New image selected' : null}
                previewUri={aadhaarBackUri ?? (aadhaarBackRemoved ? null : aadhaarBackViewUrl)}
                editable={!isReadOnly}
                onPick={handlePickAadhaarBack}
                onRemove={handleRemoveAadhaarBack}
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

export default KycPayoutsScreen;
