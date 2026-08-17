import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormInput, Header, Screen } from '@components/shared';
import { GradientButton, LogoBadge, Text } from '@components/ui';
import { useForgotPassword } from '@screens/auth/forgot-password/useForgotPassword';
import { colors, spacing } from '@theme';
import { rf } from '@utils/responsive';

/** Forgot-password screen — UI only. Logic in useForgotPassword(). */
const ForgotPasswordScreen = () => {
  const { control, isValid, isSubmitting, submitError, handleSubmit, goBack } =
    useForgotPassword();

  return (
    <Screen scrollable padded>
      <Header title="Forgot Password" onBack={goBack} />

      <View style={styles.body}>
        <LogoBadge variant="icon" icon="refresh-outline" />

        <Text variant="display" align="center" style={styles.title}>
          Reset Password
        </Text>
        <Text variant="body" color="textMuted" align="center" style={styles.subtitle}>
          Enter your email and we’ll send a code to get you back into the stream.
        </Text>

        <FormInput
          control={control}
          name="email"
          label="EMAIL ADDRESS"
          placeholder="creator@broadcast.tv"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={255}
          leftIcon="mail-outline"
          onSubmitEditing={handleSubmit}
          containerStyle={styles.input}
        />

        {submitError ? (
          <Text variant="caption" color="error" style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}

        <GradientButton
          label="Send Reset Link"
          gradient="forgot"
          textColor="onPrimaryContrast"
          rightIcon="arrow-forward"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!isValid}
          style={styles.cta}
        />

        <Pressable
          onPress={goBack}
          hitSlop={spacing.sm}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
          style={styles.back}
        >
          <Ionicons
            name="arrow-back"
            size={rf(16)}
            color={colors.textSecondary}
            style={styles.backIcon}
          />
          <Text variant="body" color="textSecondary">
            Back to Login
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  input: {
    alignSelf: 'stretch',
  },
  submitError: {
    marginBottom: spacing.sm,
    alignSelf: 'stretch',
  },
  cta: {
    alignSelf: 'stretch',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  backIcon: {
    marginRight: spacing.xs,
  },
});

export default ForgotPasswordScreen;
