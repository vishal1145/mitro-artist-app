import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@components/shared';
import { Button, Text } from '@components/ui';
import { useAppStore } from '@store';
import { colors, spacing } from '@theme';
import { rf } from '@utils/responsive';

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
    <Screen>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="color-palette-outline" size={rf(64)} color={colors.primary} />
        </View>
        <Text variant="display" align="center">
          Mitro Artist
        </Text>
        <Text variant="bodyLarge" color="textMuted" align="center">
          Create, showcase, and share your art — all in one place.
        </Text>
      </View>

      <Button label="Get started" onPress={handleContinue} style={styles.cta} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  cta: {
    marginBottom: spacing.lg,
  },
});

export default OnboardingScreen;
