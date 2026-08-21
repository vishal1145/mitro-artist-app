import { Pressable, StyleSheet, View } from 'react-native';

import { Header, InfoCallout, OtpInput, Screen } from '@components/shared';
import { GradientButton, Input, Text } from '@components/ui';
import { useChangePhone } from '@screens/profile/change-phone/useChangePhone';
import { spacing } from '@theme';

/**
 * Change the signed-in artist's number. Two stages in one modal: enter the new
 * number, then confirm the code sent to it.
 */
const VerifyNumberScreen = () => {
  const {
    stage,
    phone,
    setPhone,
    canSendCode,
    sendCode,
    code,
    setCode,
    otpHint,
    isBusy,
    error,
    isDone,
    cooldownSec,
    canResend,
    resend,
    goBack,
  } = useChangePhone();

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Change Number" onBack={goBack} />

      {isDone ? (
        <InfoCallout icon="check-circle" tone="success">
          Number updated.
        </InfoCallout>
      ) : null}

      {stage === 'number' ? (
        <>
          <View style={styles.intro}>
            <Text variant="h2">Enter your new number</Text>
            <Text variant="caption" color="textSecondary">
              We&apos;ll send a 6-digit code to confirm it&apos;s yours.
            </Text>
          </View>

          <Input
            value={phone}
            onChangeText={setPhone}
            prefix="+91"
            placeholder="00000 00000"
            keyboardType="number-pad"
            autoComplete="tel"
            returnKeyType="done"
            maxLength={10}
            accessibilityLabel="New mobile number"
            onSubmitEditing={canSendCode ? sendCode : undefined}
          />

          {error ? (
            <Text variant="caption" color="error" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <GradientButton
            label="Send Code"
            gradient="cta"
            onPress={sendCode}
            loading={isBusy}
            disabled={!canSendCode}
          />
        </>
      ) : (
        <>
          <View style={styles.intro}>
            <Text variant="h2">Enter the 6-digit code</Text>
            <Text variant="caption" color="textSecondary">
              Sent to{' '}
              <Text variant="caption" color="onSurface">
                +91 {phone}
              </Text>
            </Text>
          </View>

          {/* Shown only while the server echoes the code back. */}
          {otpHint ? (
            <InfoCallout icon="info" tone="info">
              Test mode — your code is {otpHint}
            </InfoCallout>
          ) : null}

          <OtpInput
            value={code}
            onChange={setCode}
            disabled={isBusy || isDone}
            hasError={Boolean(error)}
          />

          {/* No Verify button: the code submits itself on the 6th digit, the
              same as the sign-up screen. A button here would only ever be
              pressed after the request had already gone. */}
          <View style={styles.status}>
            {isBusy ? (
              <Text variant="caption" color="textMuted">
                Verifying…
              </Text>
            ) : null}
            {error ? (
              <Text variant="caption" color="error" accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </View>

          <View style={styles.resend}>
            {canResend ? (
              <Pressable
                onPress={resend}
                hitSlop={spacing.xs}
                accessibilityRole="button"
                accessibilityLabel="Resend code"
              >
                <Text variant="caption" color="primary">
                  Resend code
                </Text>
              </Pressable>
            ) : (
              <Text variant="caption" color="textMuted">
                Resend code in {cooldownSec}s
              </Text>
            )}
          </View>
        </>
      )}
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
  status: {
    minHeight: spacing.lg,
  },
  resend: {
    alignItems: 'center',
  },
});

export default VerifyNumberScreen;
