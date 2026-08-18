import { Pressable, StyleSheet, View } from 'react-native';

import {
  AuthBackground,
  Divider,
  FormInput,
  Screen,
  SocialButton,
} from '@components/shared';
import { GradientButton, LogoBadge, Text } from '@components/ui';
import { useLogin } from '@screens/auth/login/useLogin';
import { spacing } from '@theme';
import { wp } from '@utils/responsive';

/** Login screen — UI only. All behavior lives in useLogin(). */
const LoginScreen = () => {
  const {
    control,
    isValid,
    isSubmitting,
    submitError,
    socialNotice,
    handleSubmit,
    onSocialLogin,
    goToRegister,
    goToForgotPassword,
  } = useLogin();

  return (
    <Screen scrollable padded={false} background={<AuthBackground />}>
      <View style={styles.screenPadding}>
        <View style={styles.card}>
          <View style={styles.header}>
            <LogoBadge variant="wave" />
            <Text variant="display" align="center">
              Mitro
            </Text>
            <Text variant="subtitle" color="subtitle" align="center">
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
            textColor="ctaDark"
            rightIcon="arrow-forward"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isValid}
            style={styles.cta}
          />

          <View style={styles.dividerWrap}>
            <Divider label="OR CONNECT" />
          </View>

          <View style={styles.social}>
            <SocialButton
              provider="google"
              onPress={() => onSocialLogin('google')}
            />
            <SocialButton
              provider="apple"
              onPress={() => onSocialLogin('apple')}
            />
          </View>

          {socialNotice ? (
            <Text
              variant="caption"
              color="textMuted"
              align="center"
              style={styles.socialNotice}
            >
              {socialNotice}
            </Text>
          ) : null}

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
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenPadding: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(12),
  },
  // No panel — content sits straight on the ambient background.
  card: {
    paddingVertical: wp(7),
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  submitError: {
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.md,
  },
  dividerWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  social: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  socialNotice: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});

export default LoginScreen;
