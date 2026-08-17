import { Pressable, StyleSheet, View } from 'react-native';

import { Divider, FormInput, Screen, SocialButton } from '@components/shared';
import { Card, GradientButton, LogoBadge, Text } from '@components/ui';
import { useLogin } from '@screens/auth/login/useLogin';
import { radius, spacing } from '@theme';

/** Login screen — UI only. All behavior lives in useLogin(). */
const LoginScreen = () => {
  const {
    control,
    isValid,
    isSubmitting,
    submitError,
    handleSubmit,
    onSocialLogin,
    goToRegister,
    goToForgotPassword,
  } = useLogin();

  return (
    <Screen scrollable padded>
      <Card style={styles.card}>
        <View style={styles.header}>
          <LogoBadge variant="wave" />
          <Text variant="display" align="center">
            Mitro
          </Text>
          <Text variant="body" color="textMuted" align="center">
            Welcome back, creator.
          </Text>
        </View>

        <FormInput
          control={control}
          name="identifier"
          label="EMAIL OR USERNAME"
          placeholder="streamer@mitro.tv"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="username"
          autoCorrect={false}
          returnKeyType="next"
          maxLength={255}
          leftIcon="person-outline"
        />

        <FormInput
          control={control}
          name="password"
          label="PASSWORD"
          labelRight={
            <Pressable
              onPress={goToForgotPassword}
              hitSlop={spacing.sm}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text variant="label" color="primary">
                Forgot?
              </Text>
            </Pressable>
          }
          placeholder="Enter your password"
          isPassword
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="done"
          maxLength={64}
          leftIcon="lock-closed-outline"
          onSubmitEditing={handleSubmit}
        />

        {submitError ? (
          <Text variant="caption" color="error" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <GradientButton
          label="Go Live"
          gradient="live"
          rightIcon="arrow-forward"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid}
          style={styles.cta}
        />

        <Divider label="OR CONNECT" />

        <View style={styles.social}>
          <SocialButton provider="google" onPress={() => onSocialLogin('google')} />
          <View style={styles.socialGap} />
          <SocialButton provider="apple" onPress={() => onSocialLogin('apple')} />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="textMuted">
            Don’t have an account?{' '}
          </Text>
          <Pressable
            onPress={goToRegister}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel="Sign up"
          >
            <Text variant="link" color="primary">
              Sign Up
            </Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  submitError: {
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  social: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  socialGap: {
    width: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});

export default LoginScreen;
