import { useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AuthBackground,
  AuthLogo,
  FormInput,
  PasswordStrengthMeter,
  Screen,
} from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { useResetPassword } from '@screens/auth/reset-password/useResetPassword';
import { layout, spacing } from '@theme';
import { authPasswordStrength } from '@utils/validators';

/** New-password screen — UI only. Logic in useResetPassword(). */
const ResetPasswordScreen = () => {
  const {
    control,
    isValid,
    isSubmitting,
    submitError,
    mobile,
    handleSubmit,
    goToLogin,
  } = useResetPassword();

  const password = useWatch({ control, name: 'newPassword' }) ?? '';

  return (
    <Screen
      scrollable
      padded={false}
      background={<AuthBackground />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.body}>
        <View style={styles.header}>
          <AuthLogo />
          <Text variant="h1" align="center" style={styles.title}>
            Set New Password
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
            {mobile ? `For +91 ${mobile}` : 'Choose a new password.'}
          </Text>
        </View>

        <View style={styles.fields}>
          <View>
            <FormInput
              control={control}
              name="newPassword"
              placeholder="New password"
              isPassword
              autoCapitalize="none"
              autoComplete="password-new"
              returnKeyType="next"
              maxLength={64}
              leftIcon="lock"
            />
            {password.length ? (
              <View style={styles.meter}>
                <PasswordStrengthMeter score={authPasswordStrength(password)} />
              </View>
            ) : null}
          </View>

          <FormInput
            control={control}
            name="confirmPassword"
            placeholder="Confirm new password"
            isPassword
            autoCapitalize="none"
            autoComplete="password-new"
            returnKeyType="done"
            maxLength={64}
            leftIcon="lock"
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
            label="Reset Password"
            gradient="cta"
            rightIcon="arrow-right"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isValid}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={goToLogin}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text variant="bodyLg" color="pink">
              Back to login
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  /** See login.tsx — centring must sit on the scroll container, not the body. */
  content: {
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    marginTop: 12,
  },
  subtitle: {
    marginTop: 8,
  },
  fields: {
    gap: 14,
    marginTop: 32,
  },
  meter: {
    marginTop: 8,
  },
  submitError: {
    marginTop: 12,
  },
  cta: {
    marginTop: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default ResetPasswordScreen;
