import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, spacing } from '@theme';
import { rf } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

const icon =
  (focused: IoniconName, unfocused: IoniconName) =>
  ({ color, focused: isFocused, size }: {
    color: string;
    focused: boolean;
    size: number;
  }) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size} color={color} />
  );

/** Authenticated bottom-tab navigator. Screens lazy-load by default. */
const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: spacing.xxs,
        },
        tabBarLabelStyle: {
          fontSize: rf(11),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: icon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: icon('compass', 'compass-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: icon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
