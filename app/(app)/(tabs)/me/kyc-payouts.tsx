import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { PageHeader, Screen, SectionLabel } from '@components/shared';
import { Text } from '@components/ui';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf } from '@utils/responsive';

type FeatherIconName = keyof typeof Feather.glyphMap;
type StepState = 'done' | 'active' | 'locked';

const STEPS: { label: string; state: StepState }[] = [
  { label: 'Identity', state: 'done' },
  { label: 'Address', state: 'active' },
  { label: 'Bank', state: 'locked' },
];

const IDENTITY: {
  icon: FeatherIconName;
  title: string;
  note?: string;
  status: 'Verified' | 'Pending';
}[] = [
  { icon: 'credit-card', title: 'Government ID', status: 'Verified' },
  { icon: 'smile', title: 'Selfie check', status: 'Verified' },
  { icon: 'home', title: 'Address proof', note: 'Review in progress', status: 'Pending' },
];

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

/** Verification status and payout settings. Flat sections, no nested cards. */
const KycPayoutsScreen = () => {
  const router = useRouter();
  const [emailReceipts, setEmailReceipts] = useState(true);

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={<PageHeader title="KYC & Payouts" onBack={() => router.back()} />}
    >
      {/* Status */}
      <View style={styles.statusHead}>
        <View style={styles.shield}>
          <Feather name="shield" size={rf(17)} color={colors.gold} />
        </View>
        <View style={styles.statusText}>
          <Text variant="h3">Verification pending</Text>
          <Text variant="bodySm" color="textMuted">
            Finish KYC to unlock bank payouts.
          </Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        <View style={styles.stepperTrack} />
        {STEPS.map((step) => (
          <View key={step.label} style={styles.step}>
            <View
              style={[
                styles.stepDot,
                step.state === 'done' ? styles.stepDone : null,
                step.state === 'active' ? styles.stepActive : null,
                step.state === 'locked' ? styles.stepLocked : null,
              ]}
            >
              {step.state === 'done' ? (
                <Feather name="check" size={rf(13)} color={colors.onSuccess} />
              ) : step.state === 'locked' ? (
                <Feather name="lock" size={rf(11)} color={colors.textMuted} />
              ) : null}
            </View>
            <Text
              variant="label"
              color={
                step.state === 'done' ? 'green' : step.state === 'active' ? 'gold' : 'textMuted'
              }
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Identity */}
      <SectionLabel divider style={styles.sectionLabel}>
        IDENTITY VERIFICATION
      </SectionLabel>

      {IDENTITY.map((item, i) => (
        <View key={item.title} style={[styles.row, i === 0 ? null : styles.rowDivider]}>
          <View style={styles.rowIcon}>
            <Feather
              name={item.icon}
              size={rf(16)}
              color={item.status === 'Verified' ? colors.green : colors.gold}
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

          <StatusPill status={item.status} />
        </View>
      ))}

      {/* Bank account */}
      <SectionLabel divider style={styles.sectionLabel}>
        BANK ACCOUNT
      </SectionLabel>

      <View style={styles.empty}>
        <Feather name="briefcase" size={rf(26)} color={colors.textMuted} />
        <Text variant="bodyLg" color="textMuted" align="center" style={styles.emptyTitle}>
          No bank account linked
        </Text>
        <Text variant="bodySm" color="textMuted" align="center">
          Unlocks once identity verification is complete.
        </Text>
      </View>

      {/* Payout preferences */}
      <SectionLabel divider style={styles.sectionLabel}>
        PAYOUT PREFERENCES
      </SectionLabel>

      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Feather name="calendar" size={rf(16)} color={colors.textSecondary} />
        </View>
        <Text variant="bodyLg" color="textPrimary" style={styles.rowLabel}>
          Payout schedule
        </Text>
        <Text variant="bodySm" color="textMuted">
          Weekly
        </Text>
      </View>

      <View style={[styles.row, styles.rowDivider]}>
        <View style={styles.rowIcon}>
          <Feather name="dollar-sign" size={rf(16)} color={colors.textSecondary} />
        </View>
        <Text variant="bodyLg" color="textPrimary" style={styles.rowLabel}>
          Minimum payout
        </Text>
        <Text variant="bodySm" color="textMuted">
          500 tk
        </Text>
      </View>

      <View style={[styles.row, styles.rowDivider]}>
        <View style={styles.rowIcon}>
          <Feather name="file-text" size={rf(16)} color={colors.textSecondary} />
        </View>
        <Text variant="bodyLg" color="textPrimary" style={styles.rowLabel}>
          Email me receipts
        </Text>
        <Switch
          value={emailReceipts}
          onValueChange={setEmailReceipts}
          trackColor={{ false: colors.surfaceSoft, true: colors.pink }}
          thumbColor={colors.white}
          accessibilityLabel="Email me payout receipts"
        />
      </View>

      <Text variant="bodySm" color="textMuted" style={styles.footnote}>
        Withdrawals process in 24–48 hours, business days only.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
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
  rowLabel: {
    flex: 1,
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
