import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AuthBackground,
  AuthLegal,
  AuthLogo,
  AuthToggle,
  FormInput,
  Screen,
  type AuthToggleOption,
} from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { useLogin } from '@screens/auth/login/useLogin';
import { layout, spacing } from '@theme';

type IdentifierMode = 'mobile' | 'stage';

const MODES: readonly [AuthToggleOption<IdentifierMode>, AuthToggleOption<IdentifierMode>] = [
  { value: 'mobile', label: 'Mobile Number', icon: 'smartphone' },
  { value: 'stage', label: 'Stage Name', icon: 'at-sign' },
];

/** Login screen — UI only. All behavior lives in useLogin(). */
const LoginScreen = () => {
  const {
    control,
    isValid,
    isSubmitting,
    submitError,
    handleSubmit,
    goToRegister,
    goToForgotPassword,
  } = useLogin();

  const [mode, setMode] = useState<IdentifierMode>('mobile');
  const mobile = mode === 'mobile';

  return (
    <Screen scrollable padded={false} background={<AuthBackground />}>
      <View style={styles.body}>
        <View style={styles.header}>
          <AuthLogo />
          <Text variant="h1" align="center" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
            Sign in to keep creating and going live.
          </Text>
        </View>

        <View style={styles.toggle}>
          <AuthToggle options={MODES} value={mode} onChange={setMode} />
        </View>

        <View style={styles.fields}>
          <FormInput
            control={control}
            name="identifier"
            // Same field either way — the mode only changes how it's entered.
            prefix={mobile ? '+91' : undefined}
            leftIcon={mobile ? undefined : 'at-sign'}
            placeholder={mobile ? '00000 00000' : 'yourstagename'}
            keyboardType={mobile ? 'number-pad' : 'default'}
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            returnKeyType="next"
            maxLength={mobile ? 10 : 255}
          />

          <FormInput
            control={control}
            name="password"
            placeholder="Enter your password"
            isPassword
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            maxLength={64}
            leftIcon="lock"
            onSubmitEditing={handleSubmit}
          />
        </View>

        <Pressable
          onPress={goToForgotPassword}
          hitSlop={spacing.xs}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          style={styles.forgot}
        >
          <Text variant="bodyLg" color="cyan">
            Forgot password?
          </Text>
        </Pressable>

        {submitError ? (
          <Text variant="bodySm" color="error" align="center" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <GradientButton
          label="Login"
          gradient="cta"
          rightIcon="arrow-right"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid}
        />

        <View style={styles.footer}>
          <Text variant="body" color="textSecondary">
            Don&apos;t have an account?{' '}
          </Text>
          <Pressable
            onPress={goToRegister}
            hitSlop={spacing.xs}
            accessibilityRole="button"
            accessibilityLabel="Sign up"
          >
            <Text variant="bodyLg" color="pink">
              Sign Up
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
  // subtitle -> first element 32
  toggle: {
    marginTop: 32,
  },
  fields: {
    gap: 14,
    marginTop: 14,
  },
  // 12 above "Forgot password?", 20 below.
  forgot: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 20,
  },
  submitError: {
    marginBottom: 12,
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

export default LoginScreen;
