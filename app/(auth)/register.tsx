import { Pressable, StyleSheet, View } from 'react-native';

import { FormInput, Screen } from '@components/shared';
import { Card, GradientButton, LogoBadge, Text } from '@components/ui';
import { useRegister } from '@screens/auth/register/useRegister';
import { radius, spacing } from '@theme';

/** Register screen — UI only. Logic in useRegister(). */
const RegisterScreen = () => {
  const {
    control,
    isValid,
    isSubmitting,
    submitError,
    handleSubmit,
    goToLogin,
  } = useRegister();

  return (
    <Screen scrollable padded>
      <View style={styles.header}>
        <LogoBadge variant="icon" icon="megaphone-outline" />
        <Text variant="h2" align="center" style={styles.title}>
          Start your creator journey
        </Text>
        <Text variant="body" color="textMuted" align="center">
          Join Mitro and connect with your audience in real-time.
        </Text>
      </View>

      <Card style={styles.card}>
        <FormInput
          control={control}
          name="name"
          placeholder="Full Name"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          maxLength={50}
          leftIcon="person-outline"
        />
        <FormInput
          control={control}
          name="username"
          placeholder="creatorname"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          returnKeyType="next"
          maxLength={30}
          leftIcon="at-outline"
        />
        <FormInput
          control={control}
          name="email"
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          returnKeyType="next"
          maxLength={255}
          leftIcon="mail-outline"
        />
        <FormInput
          control={control}
          name="password"
          placeholder="Password"
          isPassword
          autoCapitalize="none"
          autoComplete="password-new"
          returnKeyType="done"
          maxLength={64}
          leftIcon="lock-closed-outline"
          onSubmitEditing={handleSubmit}
        />

        <Text variant="label" color="textSecondary" align="center" style={styles.terms}>
          By signing up, you agree to Mitro’s{' '}
          <Text variant="label" color="primary">
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text variant="label" color="primary">
            Privacy Policy
          </Text>
          .
        </Text>

        {submitError ? (
          <Text variant="caption" color="error" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <GradientButton
          label="Create Account"
          gradient="primary"
          rightIcon="arrow-forward"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid}
        />
      </Card>

      <View style={styles.footer}>
        <Text variant="body" color="textMuted">
          Already have an account?{' '}
        </Text>
        <Pressable
          onPress={goToLogin}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel="Log in"
        >
          <Text variant="link" color="primary">
            Log In
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    marginTop: spacing.sm,
  },
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
  },
  terms: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: spacing.lg,
  },
  submitError: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});

export default RegisterScreen;
