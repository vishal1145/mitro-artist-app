import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackActions } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Text } from '@components/ui';
import { colors, fontFamily, gradientDirection, gradients, layout } from '@theme';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface TabDef {
  name: string;
  label: string;
  icon: FeatherIconName;
  /** Live is the raised circular action, not a standard tab. */
  raised?: boolean;
}

const TABS: TabDef[] = [
  { name: 'home', label: 'Home', icon: 'grid' },
  { name: 'calls', label: 'Calls', icon: 'phone' },
  { name: 'live', label: 'Live', icon: 'video', raised: true },
  { name: 'business', label: 'Business', icon: 'credit-card' },
  { name: 'me', label: 'Me', icon: 'user' },
];

const ICON_SIZE = 22;
const LIVE_TAB = 'live';

/**
 * Floating pill tab bar.
 *
 * Inset 14 left/right, 10 from the bottom. navPill fill behind an 18px blur,
 * height 64, radius 26, 1px border.
 *
 * Standard tabs are flat — the active one simply tints its icon and label pink.
 * Live is a 52pt gradient circle lifted above the bar, always white-iconed.
 */
const FloatingTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom + layout.navInsetBottom }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <BlurView intensity={layout.navBlur} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.pillTint} />

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) {
              return null;
            }

            // The raised tab keeps a flex slot so the other four stay evenly
            // spaced; the circle itself is rendered over the pill below.
            if (tab.raised) {
              return <View key={route.key} style={styles.tab} />;
            }

            const focused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) {
                return;
              }

              // Tapping a tab always returns it to its root screen — switching
              // to it or re-pressing it both reset the nested stack, so a screen
              // pushed inside a tab (e.g. Business → Transactions) never sticks
              // around as the tab's landing page. `nestedKey` is undefined until
              // the tab has mounted once, in which case there's nothing to pop
              // and a fresh navigate already lands on the root.
              const nestedKey = route.state?.key;
              if (nestedKey) {
                navigation.dispatch({ ...StackActions.popToTop(), target: nestedKey });
              }

              if (!focused) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={tab.label}
              >
                <View style={styles.iconSlot}>
                  {/* Outline glyph throughout — only the tint changes. */}
                  <Feather
                    name={tab.icon}
                    size={ICON_SIZE}
                    color={focused ? colors.pink : colors.textMuted}
                  />
                </View>

                <Text
                  color={focused ? 'white' : 'textMuted'}
                  numberOfLines={1}
                  style={[styles.label, focused ? styles.labelActive : null]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Raised Live action — anchored to the pill so exactly half clears
            its top edge, independent of the row's own layout.

            The wrapper spans the full width to centre the circle, so it MUST
            be pointer-transparent; otherwise it swallows every tab tap. */}
        <View style={styles.liveWrap} pointerEvents="box-none">
          <Pressable
            onPress={() => navigation.navigate(LIVE_TAB)}
            style={styles.liveRing}
            accessibilityRole="button"
            accessibilityLabel="Live"
          >
            <LinearGradient
              colors={gradients.cta}
              start={gradientDirection.horizontal.start}
              end={gradientDirection.horizontal.end}
              style={styles.liveCircle}
            >
              <Feather name="video" size={18} color={colors.white} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

/** Authenticated bottom-tab navigator. Each tab owns a nested Stack. */
const TabsLayout = () => (
  <Tabs
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{ headerShown: false, lazy: true }}
  >
    {TABS.map((tab) => (
      <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
    ))}
  </Tabs>
);

export default TabsLayout;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: layout.navInsetX,
    right: layout.navInsetX,
  },
  pill: {
    height: layout.navHeight,
    borderRadius: layout.navRadius,
    borderWidth: 1,
    borderColor: colors.border,
    // Let the raised Live circle spill past the top edge.
    overflow: 'visible',
  },
  pillTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: layout.navRadius,
    backgroundColor: colors.navPill,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.navPaddingY,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconSlot: {
    width: 56,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Anchored to the pill, centred horizontally. Half the circle clears the top.
  liveWrap: {
    position: 'absolute',
    top: -(layout.liveCircle * layout.liveOutsideRatio) - layout.liveRing,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Screen-coloured collar, so the circle reads as punched through the bar.
  liveRing: {
    padding: layout.liveRing,
    borderRadius: layout.liveCircle / 2 + layout.liveRing,
    backgroundColor: colors.screen,
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
  liveCircle: {
    width: layout.liveCircle,
    height: layout.liveCircle,
    borderRadius: layout.liveCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    // Sentence case — the `label` type variant uppercases, so opt out here.
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'none',
  },
  labelActive: {
    fontFamily: fontFamily.extrabold,
  },
  // "LIVE" sits inside the circle, under the icon.
  liveLabel: {
    fontFamily: fontFamily.extrabold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.6,
    color: colors.white,
  },
});
