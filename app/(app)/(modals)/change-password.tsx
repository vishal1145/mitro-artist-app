import { useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  FormInput,
  Header,
  InfoCallout,
  PasswordStrengthMeter,
  Screen,
} from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { useChangePassword } from '@screens/profile/change-password/useChangePassword';
import { spacing } from '@theme';
import { authPasswordStrength } from '@utils/validators';

/** Change password — UI only. Logic in useChangePassword(). */
const ChangePasswordScreen = () => {
  const {
    control,
    isValid,
    isSubmitting,
    submitError,
    isDone,
    handleSubmit,
    goBack,
  } = useChangePassword();

  const newPassword = useWatch({ control, name: 'newPassword' }) ?? '';

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <Header title="Change Password" onBack={goBack} />

      {isDone ? (
        <InfoCallout icon="check-circle" tone="success">
          Password updated.
        </InfoCallout>
      ) : null}

      <View style={styles.fields}>
        <FormInput
          control={control}
          name="oldPassword"
          placeholder="Current password"
          isPassword
          autoCapitalize="none"
          autoComplete="password"
          returnKeyType="next"
          maxLength={64}
          leftIcon="lock"
        />

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
          {newPassword.length ? (
            <View style={styles.meter}>
              <PasswordStrengthMeter score={authPasswordStrength(newPassword)} />
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
        <Text variant="bodySm" color="error" align="center">
          {submitError}
        </Text>
      ) : null}

      <GradientButton
        label="Update Password"
        gradient="cta"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!isValid || isDone}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  fields: {
    gap: 14,
  },
  meter: {
    marginTop: 8,
  },
});

export default ChangePasswordScreen;
