import { useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AuthBackground,
  AuthLegal,
  AuthLogo,
  FormInput,
  PasswordStrengthMeter,
  Screen,
} from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { useStageNameAvailability } from '@hooks/useStageNameAvailability';
import { useRegister } from '@screens/auth/register/useRegister';
import { layout } from '@theme';
import { authPasswordStrength } from '@utils/validators';

/** Register screen — UI only. Logic in useRegister(). */
const RegisterScreen = () => {
  const { control, isValid, isSubmitting, submitError, handleSubmit, goToLogin } =
    useRegister();

  const password = useWatch({ control, name: 'password' }) ?? '';
  const stageName = useWatch({ control, name: 'username' }) ?? '';
  const { isChecking, isAvailable } = useStageNameAvailability(stageName);

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
            Create Account
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
            Join Mitro and start earning from your live shows.
          </Text>
        </View>

        <View style={styles.fields}>
          {/* No display-name field: the register endpoint accepts only
              phone, stageName and password. Display name is set later from
              Settings -> Public details. */}
          <View>
            <FormInput
              control={control}
              name="username"
              placeholder="Choose your stage name"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              returnKeyType="next"
              maxLength={20}
              leftIcon="at-sign"
              // Strip spaces and force lowercase as the user types.
              transform={(v) => v.replace(/\s+/g, '').toLowerCase()}
            />
            {/* Advisory only — the server still has the final say on submit. */}
            {isChecking ? (
              <Text variant="bodySm" color="textSecondary" style={styles.availability}>
                Checking availability…
              </Text>
            ) : isAvailable === true ? (
              <Text variant="bodySm" color="success" style={styles.availability}>
                {stageName} is available
              </Text>
            ) : isAvailable === false ? (
              <Text variant="bodySm" color="error" style={styles.availability}>
                {stageName} is taken
              </Text>
            ) : null}
          </View>

          <FormInput
            control={control}
            name="mobile"
            prefix="+91"
            placeholder="00000 00000"
            keyboardType="number-pad"
            autoComplete="tel"
            returnKeyType="next"
            maxLength={10}
            transform={(v) => v.replace(/\D/g, '')}
          />

          <View>
            <FormInput
              control={control}
              name="password"
              placeholder="Enter your password"
              isPassword
              autoCapitalize="none"
              autoComplete="password-new"
              returnKeyType="done"
              maxLength={64}
              leftIcon="lock"
              onSubmitEditing={handleSubmit}
            />
            {password.length ? (
              <View style={styles.meter}>
                <PasswordStrengthMeter score={authPasswordStrength(password)} />
              </View>
            ) : null}
          </View>
        </View>

        {submitError ? (
          <Text variant="bodySm" color="error" align="center" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <View style={styles.cta}>
          <GradientButton
            label="Continue"
            gradient="cta"
            rightIcon="arrow-right"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isValid}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="textSecondary">
            Already have an account?{' '}
          </Text>
          <Pressable
            onPress={goToLogin}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Log in"
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
  // logo -> heading 32
  title: {
    marginTop: 12,
  },
  // heading -> subtitle 8
  subtitle: {
    marginTop: 8,
  },
  // subtitle -> first field 32, then 14 between fields
  fields: {
    gap: 14,
    marginTop: 32,
  },
  availability: {
    marginTop: 8,
  },
  meter: {
    marginTop: 8,
  },
  submitError: {
    marginTop: 12,
  },
  // last field -> CTA 24
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

export default RegisterScreen;
