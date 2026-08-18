import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, spacing } from '@theme';
import { rf } from '@utils/responsive';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  color: string;
  focused: boolean;
  size: number;
}

/** Builds a tab-bar icon renderer that swaps between filled and outline. */
const icon = (focused: IoniconName, unfocused: IoniconName) => {
  const TabBarIcon = ({ color, focused: isFocused, size }: TabIconProps) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size} color={color} />
  );
  TabBarIcon.displayName = `TabBarIcon(${focused})`;
  return TabBarIcon;
};

/**
 * Authenticated bottom-tab navigator.
 * Each tab owns a nested Stack so per-tab history is preserved.
 */
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
          tabBarIcon: icon('grid', 'grid-outline'),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: icon('call', 'call-outline'),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: icon('videocam', 'videocam-outline'),
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: 'Business',
          tabBarIcon: icon('wallet', 'wallet-outline'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: icon('person-circle', 'person-circle-outline'),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
