import { Stack, useRouter } from 'expo-router';

import { EmptyState, Screen } from '@components/shared';

/** 404 route. */
const NotFound = () => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <EmptyState
          variant="error"
          icon="compass"
          title="Page not found"
          description="The screen you’re looking for doesn’t exist."
          actionLabel="Go home"
          onAction={() => router.replace('/')}
        />
      </Screen>
    </>
  );
};

export default NotFound;
