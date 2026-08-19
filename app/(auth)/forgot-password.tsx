import { Pressable, StyleSheet, View } from 'react-native';

import { AuthBackground, AuthLegal, AuthLogo, FormInput, Screen } from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { useForgotPassword } from '@screens/auth/forgot-password/useForgotPassword';
import { layout, spacing } from '@theme';

/** Forgot-password screen — UI only. Logic in useForgotPassword(). */
const ForgotPasswordScreen = () => {
  const { control, isValid, isSubmitting, submitError, handleSubmit, goBack } =
    useForgotPassword();

  return (
    <Screen scrollable padded={false} background={<AuthBackground />}>
      <View style={styles.body}>
        <View style={styles.header}>
          <AuthLogo />
          <Text variant="h1" align="center" style={styles.title}>
            Forgot Password
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
            Enter your registered mobile number and we&apos;ll send you a code.
          </Text>
        </View>

        <View style={styles.field}>
          <FormInput
            control={control}
            name="mobile"
            prefix="+91"
            placeholder="00000 00000"
            keyboardType="number-pad"
            autoComplete="tel"
            returnKeyType="done"
            maxLength={10}
            transform={(v) => v.replace(/\D/g, '')}
            onSubmitEditing={handleSubmit}
          />
        </View>

        {submitError ? (
          <Text variant="bodySm" color="error" align="center" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <View style={styles.cta}>
          <GradientButton
            label="Send OTP"
            gradient="cta"
            rightIcon="arrow-forward"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isValid}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="textSecondary">
            Remembered your password?{' '}
          </Text>
          <Pressable
            onPress={goBack}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text variant="bodyLg" color="pink">
              Login
            </Text>
          </Pressable>
        </View>

        <View style={styles.legal}>
          <AuthLegal />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
  },
  // logo -> heading 32
  title: {
    marginTop: 32,
  },
  // heading -> subtitle 8
  subtitle: {
    marginTop: 8,
  },
  // subtitle -> field 32
  field: {
    marginTop: 32,
  },
  submitError: {
    marginTop: 12,
  },
  // field -> CTA 24
  cta: {
    marginTop: 24,
  },
  // CTA -> alt row 20
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  // alt row -> age note 32
  legal: {
    marginTop: 32,
  },
});

export default ForgotPasswordScreen;
