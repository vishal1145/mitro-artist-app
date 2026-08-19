import { StyleSheet, View } from 'react-native';

import { Header, OtpInput, Screen } from '@components/shared';
import { Button, Text } from '@components/ui';
import { useOtp } from '@screens/auth/otp/useOtp';
import { spacing } from '@theme';

/** OTP verification screen — UI only. Logic in useOtp(). */
const OtpVerifyScreen = () => {
  const {
    code,
    setCode,
    isSubmitting,
    error,
    locked,
    attemptsLeft,
    cooldownSec,
    canResend,
    mobile,
    resend,
    goBack,
  } = useOtp();

  return (
    <Screen scrollable>
      <Header title="Verify code" onBack={goBack} />

      <View style={styles.intro}>
        <Text variant="body" color="textMuted">
          Enter the 6-digit code we sent to{' '}
        </Text>
        <Text variant="link" color="textPrimary">
          {mobile ? `+91 ${mobile}` : 'your mobile'}
        </Text>
      </View>

      <OtpInput
        value={code}
        onChange={setCode}
        disabled={locked || isSubmitting}
        hasError={Boolean(error)}
      />

      <View style={styles.status}>
        {isSubmitting ? (
          <Text variant="caption" color="textMuted">
            Verifying…
          </Text>
        ) : null}
        {error ? (
          <Text variant="caption" color="error" accessibilityRole="alert">
            {error}
            {!locked ? ` ${attemptsLeft} attempt(s) left.` : ''}
          </Text>
        ) : null}
        {locked ? (
          <Text variant="caption" color="error">
            Too many attempts. Please go back and try again later.
          </Text>
        ) : null}
      </View>

      <Button
        label={
          canResend
            ? 'Resend code'
            : `Resend code in ${cooldownSec}s`
        }
        variant="ghost"
        onPress={resend}
        disabled={!canResend}
        style={styles.resend}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  status: {
    minHeight: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  resend: {
    marginTop: spacing.md,
  },
});

export default OtpVerifyScreen;
