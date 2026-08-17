import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@components/shared';
import { Button, Text } from '@components/ui';
import { useAuthStore } from '@store';
import { spacing } from '@theme';

/** Profile tab — stub with a working logout. Awaiting the Stitch design. */
const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1">Profile</Text>
          <Text variant="body" color="textMuted">
            {user?.email ?? 'Signed in'}
          </Text>
        </View>

        <Button
          label="Log out"
          variant="danger"
          leftIcon="log-out-outline"
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
});

export default ProfileScreen;
