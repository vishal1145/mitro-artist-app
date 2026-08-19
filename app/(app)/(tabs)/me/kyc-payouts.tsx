import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Header, ListRow, Screen, ToggleRow } from '@components/shared';
import { Card, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;
type StepState = 'done' | 'active' | 'locked';

const STEPS: { label: string; state: StepState }[] = [
  { label: 'Identity', state: 'done' },
  { label: 'Address', state: 'active' },
  { label: 'Bank', state: 'locked' },
];

const IDENTITY: {
  icon: IoniconName;
  title: string;
  note?: string;
  status: 'Verified' | 'Pending';
}[] = [
  { icon: 'card-outline', title: 'Government ID', status: 'Verified' },
  { icon: 'happy-outline', title: 'Selfie check', status: 'Verified' },
  { icon: 'home-outline', title: 'Address proof', note: 'Review in progress', status: 'Pending' },
];

/** Uppercase card header strip. */
const CardHead = ({ children }: { children: string }) => (
  <View style={styles.cardHead}>
    <Text variant="label" color="textSecondary">
      {children}
    </Text>
  </View>
);

/** Status pill with a leading dot. */
const StatusPill = ({ status }: { status: 'Verified' | 'Pending' }) => {
  const verified = status === 'Verified';
  return (
    <View style={[styles.pill, { backgroundColor: verified ? colors.successChip : colors.warningChip }]}>
      <View
        style={[styles.pillDot, { backgroundColor: verified ? colors.success : colors.warning }]}
      />
      <Text variant="label" color={verified ? 'success' : 'warning'}>
        {status}
      </Text>
    </View>
  );
};

const KycPayoutsScreen = () => {
  const router = useRouter();
  const [emailReceipts, setEmailReceipts] = useState(true);

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      <Header title="KYC & Payouts" onBack={() => router.back()} />

      {/* Verification status + stepper */}
      <View style={styles.statusCard}>
        <View style={styles.statusAccent} />
        <View style={styles.statusBody}>
          <View style={styles.statusTop}>
            <View style={styles.statusIcon}>
              <Ionicons name="shield-outline" size={rf(18)} color={colors.warning} />
            </View>
            <View style={styles.statusText}>
              <Text variant="h3">Verification pending</Text>
              <Text variant="caption" color="textSecondary">
                Complete your KYC verification to unlock bank payouts and withdrawal features.
              </Text>
            </View>
          </View>

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
                    <Ionicons name="checkmark" size={rf(14)} color={colors.onSuccess} />
                  ) : step.state === 'active' ? (
                    <View style={styles.stepPulse} />
                  ) : (
                    <Ionicons name="lock-closed" size={rf(12)} color={colors.textMuted} />
                  )}
                </View>
                <Text
                  variant="label"
                  color={
                    step.state === 'done'
                      ? 'success'
                      : step.state === 'active'
                        ? 'warning'
                        : 'textMuted'
                  }
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Identity verification */}
      <Card style={styles.listCard}>
        <CardHead>IDENTITY VERIFICATION</CardHead>
        {IDENTITY.map((item, i) => (
          <View key={item.title} style={styles.listRowWrap}>
            <ListRow
              icon={item.icon}
              iconTint={item.status === 'Verified' ? colors.success : colors.warning}
              title={item.title}
              subtitle={item.note}
              right={<StatusPill status={item.status} />}
              chevron
              divider={i > 0}
              onPress={() => undefined}
            />
          </View>
        ))}
      </Card>

      {/* Bank account — locked until KYC completes */}
      <Card style={styles.listCard}>
        <CardHead>BANK ACCOUNT</CardHead>
        <View style={styles.lockedBody}>
          <View style={styles.lockedIcon}>
            <Ionicons name="business-outline" size={rf(26)} color={colors.textMuted} />
          </View>
          <Text variant="body" color="textMuted" align="center">
            No bank account linked
          </Text>
          <Pressable style={styles.dashedBtn} disabled accessibilityRole="button" accessibilityLabel="Add bank account (locked)">
            <Ionicons name="lock-closed" size={rf(14)} color={colors.textMuted} />
            <Text variant="label" color="textMuted">
              Add bank account
            </Text>
          </Pressable>
          <Text variant="caption" color="textMuted" align="center" style={styles.lockedNote}>
            Unlocks once identity verification is complete.
          </Text>
        </View>
      </Card>

      {/* Payout preferences */}
      <Card style={styles.listCard}>
        <CardHead>PAYOUT PREFERENCES</CardHead>
        <View style={styles.listRowWrap}>
          <ListRow icon="calendar-outline" title="Payout schedule" value="Weekly" valueColor="textSecondary" chevron onPress={() => undefined} />
        </View>
        <View style={styles.listRowWrap}>
          <ListRow icon="cash-outline" title="Minimum payout" value="500 tk" valueColor="textSecondary" chevron divider onPress={() => undefined} />
        </View>
        <View style={[styles.listRowWrap, styles.receiptsRow]}>
          <ToggleRow
            icon="receipt-outline"
            label="Email me payout receipts"
            value={emailReceipts}
            onValueChange={setEmailReceipts}
          />
        </View>
      </Card>

      {/* Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoAccent} />
        <View style={styles.infoBody}>
          <Ionicons name="information-circle-outline" size={rf(17)} color={colors.primary} />
          <Text variant="caption" color="textSecondary" style={styles.infoText}>
            Withdrawals typically process within 24-48 hours once requested. Business days only.
          </Text>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  statusCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  statusAccent: {
    width: wp(1.5),
    backgroundColor: colors.warning,
  },
  statusBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.lg,
  },
  statusTop: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: radius.full,
    backgroundColor: colors.warningChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
    gap: spacing.xxs,
  },

  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  stepperTrack: {
    position: 'absolute',
    left: wp(8),
    right: wp(8),
    top: wp(4),
    height: 2,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
  },
  step: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepDot: {
    width: wp(8),
    height: wp(8),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: colors.success,
  },
  stepActive: {
    backgroundColor: colors.warning,
  },
  stepLocked: {
    backgroundColor: colors.surfaceElevated,
  },
  stepPulse: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: radius.full,
    backgroundColor: colors.warningBg,
  },

  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardHead: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listRowWrap: {
    paddingHorizontal: spacing.md,
  },
  receiptsRow: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  pillDot: {
    width: wp(1.5),
    height: wp(1.5),
    borderRadius: radius.full,
  },

  lockedBody: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  lockedIcon: {
    width: wp(16),
    height: wp(16),
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    opacity: 0.6,
  },
  lockedNote: {
    marginTop: spacing.xxs,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  infoAccent: {
    width: wp(1.5),
    backgroundColor: colors.primary,
  },
  infoBody: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamily.body,
  },
});

export default KycPayoutsScreen;
