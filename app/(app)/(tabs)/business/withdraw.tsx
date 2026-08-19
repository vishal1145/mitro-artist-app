import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Header, ListRow, Screen } from '@components/shared';
import { Card, GradientButton, Text } from '@components/ui';
import { colors, fontFamily, radius, spacing } from '@theme';
import { rf, wp } from '@utils/responsive';

const PLATFORM_FEE = 20;
const PROCESSING_FEE = 5;
const MIN_WITHDRAWAL = 500;

const CHIPS = ['25%', '50%', '100%', 'Custom'] as const;

const WithdrawScreen = () => {
  const router = useRouter();
  const { availableTk } = useLocalSearchParams<{ availableTk?: string }>();

  const available = Number(availableTk) || 819;
  const [amount, setAmount] = useState(String(available));
  const [activeChip, setActiveChip] = useState<string>('100%');

  const parsed = Number(amount) || 0;
  const receives = useMemo(
    () => Math.max(0, parsed - PLATFORM_FEE - PROCESSING_FEE),
    [parsed],
  );
  const belowMinimum = parsed > 0 && parsed < MIN_WITHDRAWAL;

  const onChip = (chip: string) => {
    setActiveChip(chip);
    if (chip === 'Custom') {
      setAmount('');
      return;
    }
    const pct = parseInt(chip, 10) / 100;
    setAmount(String(Math.floor(available * pct)));
  };

  return (
    <Screen tabBarSpacing scrollable contentContainerStyle={styles.content}>
      <Header title="Withdraw" onBack={() => router.back()} />

      {/* Available balance hero */}
      <Card style={styles.hero}>
        <Text variant="label" color="primary" style={styles.heroLabel}>
          AVAILABLE TO WITHDRAW
        </Text>
        <View style={styles.heroValue}>
          <Text variant="display" style={styles.heroNumber}>
            {available}
          </Text>
          <Text variant="h3" color="textSecondary">
            tk
          </Text>
        </View>
        <View style={styles.heroPending}>
          <Ionicons name="time-outline" size={rf(14)} color={colors.warning} />
          <Text variant="caption" color="textMuted">
            674 tk still pending
          </Text>
        </View>
      </Card>

      {/* Amount input */}
      <View style={styles.amountWrap}>
        <TextInput
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setActiveChip('Custom');
          }}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textDisabled}
          style={styles.amountInput}
          accessibilityLabel="Withdrawal amount"
        />
        <Text variant="h3" color="textDisabled" style={styles.amountUnit}>
          tk
        </Text>
      </View>

      {/* Quick amount chips */}
      <View style={styles.chips}>
        {CHIPS.map((chip) => {
          const active = chip === activeChip;
          return (
            <Pressable
              key={chip}
              onPress={() => onChip(chip)}
              style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Withdraw ${chip}`}
            >
              <Text variant="label" color={active ? 'ctaDark' : 'textPrimary'}>
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Destination */}
      <Card style={styles.destination}>
        <ListRow
          icon="business-outline"
          title="HDFC Bank ****4829"
          subtitle="Primary account"
          chevron={false}
          right={
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/me/kyc-payouts')}
              hitSlop={spacing.xs}
              accessibilityRole="button"
              accessibilityLabel="Change bank account"
            >
              <Text variant="label" color="primary">
                Change
              </Text>
            </Pressable>
          }
        />
      </Card>

      {/* Breakdown */}
      <Card style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text variant="caption" color="textSecondary">
            Withdrawal amount
          </Text>
          <Text variant="caption" color="textPrimary">
            {parsed} tk
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text variant="caption" color="textSecondary">
            Platform fee
          </Text>
          <Text variant="caption" color="error">
            -{PLATFORM_FEE} tk
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text variant="caption" color="textSecondary">
            Processing fee
          </Text>
          <Text variant="caption" color="error">
            -{PROCESSING_FEE} tk
          </Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text variant="body" color="textPrimary" style={styles.bold}>
            You receive
          </Text>
          <Text variant="h3" color="success">
            {receives} tk
          </Text>
        </View>
      </Card>

      {/* Warning */}
      <View style={styles.warning}>
        <Ionicons name="information-circle-outline" size={rf(17)} color={colors.warning} />
        <Text variant="caption" color="textSecondary" style={styles.warningText}>
          Payouts process within 24-48 hours. KYC must be complete to avoid delays.
        </Text>
      </View>

      <GradientButton
        label="Request Payout"
        gradient="forgot"
        textColor="ctaDark"
        rightIcon="arrow-forward"
        disabled={parsed <= 0 || belowMinimum}
        onPress={() => router.back()}
      />
      <Text variant="label" color={belowMinimum ? 'error' : 'textMuted'} align="center">
        Minimum withdrawal {MIN_WITHDRAWAL} tk
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  heroLabel: {
    letterSpacing: 1.6,
  },
  heroValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  heroNumber: {
    fontSize: rf(40),
  },
  heroPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  amountWrap: {
    justifyContent: 'center',
  },
  amountInput: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: fontFamily.display,
    fontSize: rf(32),
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  amountUnit: {
    position: 'absolute',
    right: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.surfaceElevated,
  },
  destination: {
    paddingVertical: spacing.xs,
  },
  breakdown: {
    gap: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  bold: {
    fontFamily: fontFamily.bodySemibold,
  },
  warning: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderLeftWidth: wp(1),
    borderLeftColor: colors.warning,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
  },
});

export default WithdrawScreen;
