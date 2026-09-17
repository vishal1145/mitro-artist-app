import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { InfoCallout, LoadFailed, PageHeader, Screen, SectionLabel, Skeleton } from '@components/shared';
import { Text } from '@components/ui';
import { useBankAccount, useKyc } from '@hooks/useKyc';
import { colors, fontFamily, layout, radius } from '@theme';
import { getErrorMessage } from '@utils/errorHandler';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;
type StepState = 'done' | 'active' | 'locked';

/** Status pill with a leading dot. */
const StatusPill = ({ status }: { status: 'Verified' | 'Pending' }) => {
  const verified = status === 'Verified';
  return (
    <View style={styles.pill}>
      <View
        style={[styles.pillDot, { backgroundColor: verified ? colors.green : colors.gold }]}
      />
      <Text variant="label" color={verified ? 'green' : 'gold'}>
        {status}
      </Text>
    </View>
  );
};

/**
 * Verification status and payout account. Real state from `GET /api/artist/kyc`
 * and `GET /api/artist/kyc/bank-account` — the same routes the web reads. The
 * document-upload flow itself still lives on the web; this is the read view.
 */
const KycPayoutsScreen = () => {
  const router = useRouter();
  const { data: kyc, isLoading, error, refetch, isRefetching } = useKyc();
  const { data: bank } = useBankAccount();

  // Step completion derived purely from the server flags (this is a read-only
  // status view, so there's no in-progress form state to fold in).
  const panDone = !!kyc?.panFrontUploaded;
  const aadhaarDone = !!(kyc?.aadhaarFrontUploaded && kyc?.aadhaarBackUploaded);
  const bankDone = !!bank && !!(bank.accountNumber || bank.bankName);

  const steps: { label: string; done: boolean }[] = [
    { label: 'PAN', done: panDone },
    { label: 'Aadhaar', done: aadhaarDone },
    { label: 'Bank', done: bankDone },
  ];
  const firstPending = steps.findIndex((s) => !s.done);
  const remaining = steps.filter((s) => !s.done).length;
  const stepStateAt = (i: number): StepState =>
    steps[i].done ? 'done' : i === firstPending ? 'active' : 'locked';

  const kycState: 'approved' | 'rejected' | 'under_review' | 'incomplete' =
    kyc?.status === 'approved'
      ? 'approved'
      : kyc?.status === 'rejected'
        ? 'rejected'
        : remaining === 0
          ? 'under_review'
          : 'incomplete';

  const headline =
    kycState === 'approved'
      ? 'KYC verified'
      : kycState === 'rejected'
        ? 'Verification rejected'
        : kycState === 'under_review'
          ? 'Under review'
          : 'Verification required';

  const subline =
    kycState === 'approved'
      ? 'Your bank payouts are enabled.'
      : kycState === 'rejected'
        ? kyc?.rejectionReason || 'Please review your details and resubmit.'
        : kycState === 'under_review'
          ? 'All steps complete — under review by our team.'
          : `Finish ${remaining} more step${remaining === 1 ? '' : 's'} to unlock bank payouts.`;

  const shieldColor =
    kycState === 'approved' ? colors.green : kycState === 'rejected' ? colors.red : colors.gold;

  // PAN + Aadhaar rows — the two documents the backend actually tracks.
  const identity: { icon: FeatherIconName; title: string; note?: string; done: boolean }[] = [
    { icon: 'credit-card', title: 'PAN card', note: kyc?.panNumber ?? undefined, done: panDone },
    { icon: 'file-text', title: 'Aadhaar', note: kyc?.aadhaarNumber ?? undefined, done: aadhaarDone },
  ];

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={<PageHeader title="KYC & Payouts" onBack={() => router.back()} />}
    >
      {isLoading ? (
        <View style={styles.loading}>
          <View style={styles.statusHead}>
            <Skeleton width={42} height={42} round={21} />
            <View style={styles.statusText}>
              <Skeleton width={180} height={18} round={9} />
              <Skeleton width={220} height={12} round={6} />
            </View>
          </View>
          <Skeleton height={26} round={13} style={styles.loadingStepper} />
          <Skeleton height={90} round={12} style={styles.loadingBlock} />
          <Skeleton height={56} round={12} style={styles.loadingBlock} />
          <Skeleton height={56} round={12} style={styles.loadingBlock} />
        </View>
      ) : error ? (
        <LoadFailed
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : (
        <>
          {/* Status */}
          <View style={styles.statusHead}>
            <View style={styles.shield}>
              <Feather name="shield" size={rf(17)} color={shieldColor} />
            </View>
            <View style={styles.statusText}>
              <Text variant="h3">{headline}</Text>
              <Text variant="bodySm" color="textMuted">
                {subline}
              </Text>
            </View>
          </View>

          {/* Stepper */}
          <View style={styles.stepper}>
            <View style={styles.stepperTrack} />
            {steps.map((step, i) => {
              const state = stepStateAt(i);
              return (
                <View key={step.label} style={styles.step}>
                  <View
                    style={[
                      styles.stepDot,
                      state === 'done' ? styles.stepDone : null,
                      state === 'active' ? styles.stepActive : null,
                      state === 'locked' ? styles.stepLocked : null,
                    ]}
                  >
                    {state === 'done' ? (
                      <Feather name="check" size={rf(13)} color={colors.onSuccess} />
                    ) : state === 'locked' ? (
                      <Feather name="lock" size={rf(11)} color={colors.textMuted} />
                    ) : null}
                  </View>
                  <Text
                    variant="label"
                    color={state === 'done' ? 'green' : state === 'active' ? 'gold' : 'textMuted'}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.callout}>
            <InfoCallout icon="shield" tone="warning">
              Why we ask: Indian payment regulations require verified identity and bank details
              before we can release your earnings. Reviews usually take 24–48 hours, and your
              documents are encrypted and only used for payout compliance — never shown on your
              profile.
            </InfoCallout>
          </View>

          {/* Identity */}
          <SectionLabel divider style={styles.sectionLabel}>
            IDENTITY VERIFICATION
          </SectionLabel>

          {identity.map((item, i) => (
            <View key={item.title} style={[styles.row, i === 0 ? null : styles.rowDivider]}>
              <View style={styles.rowIcon}>
                <Feather
                  name={item.icon}
                  size={rf(16)}
                  color={item.done ? colors.green : colors.gold}
                />
              </View>

              <View style={styles.rowText}>
                <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.note ? (
                  <Text variant="bodySm" color="textMuted">
                    {item.note}
                  </Text>
                ) : null}
              </View>

              <StatusPill status={item.done ? 'Verified' : 'Pending'} />
            </View>
          ))}

          {/* Bank account */}
          <SectionLabel divider style={styles.sectionLabel}>
            BANK ACCOUNT
          </SectionLabel>

          {bankDone ? (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Feather name="briefcase" size={rf(16)} color={colors.green} />
              </View>
              <View style={styles.rowText}>
                <Text variant="bodyLg" color="textPrimary" numberOfLines={1}>
                  {bank?.bankName || 'Bank account'}
                </Text>
                {bank?.accountNumber ? (
                  <Text variant="bodySm" color="textMuted">
                    {bank.accountNumber}
                  </Text>
                ) : null}
              </View>
              <StatusPill status="Verified" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="briefcase" size={rf(26)} color={colors.textMuted} />
              <Text variant="bodyLg" color="textMuted" align="center" style={styles.emptyTitle}>
                No bank account linked
              </Text>
              <Text variant="bodySm" color="textMuted" align="center">
                Unlocks once identity verification is complete.
              </Text>
            </View>
          )}

          <Text variant="bodySm" color="textMuted" style={styles.footnote}>
            Withdrawals process in 24–48 hours, business days only.
          </Text>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  loading: {
    gap: 18,
    marginTop: 12,
  },
  loadingStepper: {
    marginTop: 8,
  },
  loadingBlock: {
    marginTop: 4,
  },

  statusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  shield: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
    gap: 2,
  },

  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  // Hairline behind the dots, inset so it starts and ends under them.
  stepperTrack: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: 13,
    height: 1,
    backgroundColor: colors.border,
  },
  step: {
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: colors.green,
  },
  stepActive: {
    backgroundColor: colors.gold,
  },
  stepLocked: {
    backgroundColor: colors.surfaceSoft,
  },

  callout: {
    marginTop: 22,
  },

  sectionLabel: {
    marginTop: 26,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
  },

  footnote: {
    marginTop: 26,
  },
});

export default KycPayoutsScreen;
