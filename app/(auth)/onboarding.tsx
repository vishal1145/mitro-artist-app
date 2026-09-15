import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthBackground, AuthLogo, Screen } from '@components/shared';
import { GradientButton, Text } from '@components/ui';
import { useAppStore } from '@store';
import { layout, spacing } from '@theme';

/** Feature highlights — mirrors the web register/landing story bullets. */
const FEATURES: readonly { emoji: string; label: string }[] = [
  { emoji: '🎥', label: 'Go Live Instantly' },
  { emoji: '💬', label: 'Engage With Your Audience' },
  { emoji: '🎁', label: 'Receive Gifts & Rewards' },
  { emoji: '👥', label: 'Build a Loyal Fan Community' },
  { emoji: '⭐', label: 'Create Exclusive Experiences' },
  { emoji: '📈', label: 'Grow Your Personal Brand' },
];

/** First-launch onboarding. Sets the MMKV flag and continues to login. */
const OnboardingScreen = () => {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const handleContinue = useCallback(() => {
    // State updates synchronously; persistence completes in the background.
    void completeOnboarding();
    router.replace('/(auth)/login');
  }, [completeOnboarding, router]);

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
          <Text variant="display" align="center" style={styles.brand}>
            Mitro
          </Text>
          <Text variant="h3" color="pink" align="center" style={styles.tagline}>
            Go Live. Connect. Earn.
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={styles.story}>
            Showcase your talent, build meaningful relationships with your fans, and
            unlock new earning opportunities through live interactive experiences.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.featureRow}>
              <Text variant="h3" style={styles.featureEmoji}>
                {feature.emoji}
              </Text>
              <Text variant="body" color="textPrimary">
                {feature.label}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="bodyLg" color="cyan" align="center" style={styles.waiting}>
          Your Audience Is Waiting.
        </Text>

        <GradientButton
          label="Get Started"
          gradient="cta"
          rightIcon="arrow-right"
          onPress={handleContinue}
          style={styles.cta}
        />

        <Text variant="bodySm" color="error" align="center" style={styles.legal}>
          Mitro is an entertainment platform for adult audiences (18+ only). By
          continuing, you confirm that you are 18 years or older.
        </Text>
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
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
  },
  // logo -> brand 12
  brand: {
    marginTop: 12,
  },
  // brand -> tagline 8
  tagline: {
    marginTop: 8,
  },
  // tagline -> story 12
  story: {
    marginTop: 12,
  },
  // story -> feature list 28
  features: {
    marginTop: 28,
    gap: 14,
    alignSelf: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureEmoji: {
    width: 28,
    textAlign: 'center',
  },
  // list -> tagline 28
  waiting: {
    marginTop: 28,
    marginBottom: 24,
  },
  cta: {
    marginTop: 4,
  },
  // CTA -> age note 24
  legal: {
    marginTop: 24,
  },
});

export default OnboardingScreen;
