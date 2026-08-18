import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Header, OtpInput, Screen } from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { TIMING } from '@constants';
import { spacing } from '@theme';
import { LIMITS } from '@utils/validators';

/**
 * In-app number verification. The auth stack's OTP screen is behind the auth
 * guard, so an already-signed-in creator needs this modal instead.
 */
const VerifyNumberScreen = () => {
  const router = useRouter();
  const { phone, purpose } = useLocalSearchParams<{ phone?: string; purpose?: string }>();

  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState<number>(TIMING.otpResendCooldownSec);

  const target = phone ?? '+91 98765 43210';
  const changingNumber = purpose === 'change_number';

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title={changingNumber ? 'Change Number' : 'Verify Number'} onBack={() => router.back()} />

      <View style={styles.intro}>
        <Text variant="h2">Enter the 6-digit code</Text>
        <Text variant="caption" color="textSecondary">
          We sent a verification code to{' '}
          <Text variant="caption" color="onSurface">
            {target}
          </Text>
          . It expires in 10 minutes.
        </Text>
      </View>

      <OtpInput value={code} onChange={setCode} />

      <GradientButton
        label="Verify"
        gradient="forgot"
        textColor="ctaDark"
        disabled={code.length < LIMITS.otp.length}
        onPress={() => router.back()}
      />

      <View style={styles.resend}>
        {cooldown > 0 ? (
          <Text variant="caption" color="textMuted">
            Resend code in {cooldown}s
          </Text>
        ) : (
          <Pressable
            onPress={() => setCooldown(TIMING.otpResendCooldownSec)}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel="Resend code"
          >
            <Text variant="caption" color="primary">
              Resend code
            </Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    gap: spacing.xs,
  },
  resend: {
    alignItems: 'center',
  },
});

export default VerifyNumberScreen;
