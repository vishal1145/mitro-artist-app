import { memo, useRef, type ReactElement, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@navigation/useTabBarSpace';
import { colors, layout, spacing } from '@theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (for forms / long content). */
  scrollable?: boolean;
  /** Apply default horizontal padding. */
  padded?: boolean;
  edges?: readonly Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Decorative element rendered absolutely behind all content (e.g. a grid/glow backdrop). */
  background?: ReactNode;
  /**
   * Pinned top bar. Rendered outside the ScrollView so it stays put while the
   * content scrolls under it. Gets the screen's horizontal padding.
   */
  header?: ReactNode;
  /**
   * Reserve room for the floating tab bar. Required on any scrollable screen
   * inside the tabs, otherwise the last row is clipped behind the nav pill.
   */
  tabBarSpacing?: boolean;
  /** Pull-to-refresh — forwarded straight to the ScrollView. Requires `scrollable`. */
  refreshControl?: ReactElement<RefreshControlProps>;
  /**
   * Infinite scroll. Fires once each time the content bottom comes within
   * `endReachedOffset` of the viewport, and re-arms only after the user has
   * scrolled back out of that zone — so a screen can keep loading pages
   * without a "load more" button and without firing on every frame.
   * Requires `scrollable`.
   */
  onEndReached?: () => void;
  /** Distance from the bottom, in px, that counts as "reached". */
  endReachedOffset?: number;
}

/**
 * Safe-area + keyboard-aware screen wrapper. Every route renders inside one
 * of these so padding, background and keyboard behavior stay consistent.
 */
const ScreenComponent = ({
  children,
  scrollable = false,
  padded = true,
  edges = ['top', 'bottom'],
  contentContainerStyle,
  style,
  background,
  header,
  tabBarSpacing = false,
  refreshControl,
  onEndReached,
  endReachedOffset = 320,
}: ScreenProps) => {
  const body = padded ? styles.padded : undefined;
  const tabSpace = useTabBarSpace();
  const tabPad = tabBarSpacing ? { paddingBottom: tabSpace } : undefined;

  // Latched so one long flick fires `onEndReached` once, not on every frame.
  const endReachedArmed = useRef(true);
  const handleScroll = onEndReached
    ? ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
        const distanceToEnd =
          contentSize.height - contentOffset.y - layoutMeasurement.height;
        if (distanceToEnd <= endReachedOffset) {
          if (endReachedArmed.current) {
            endReachedArmed.current = false;
            onEndReached();
          }
        } else {
          endReachedArmed.current = true;
        }
      }
    : undefined;

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {background ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {background}
        </View>
      ) : null}
      {/*
        `padding` on BOTH platforms, not just iOS.

        The Android default of `undefined` assumes the window resizes itself
        via `adjustResize`, which is not happening in this build — the content
        did not move at all when the keyboard opened, so fields sat underneath
        it. Driving the inset from JS keyboard events works regardless of the
        activity's softInputMode. `softwareKeyboardLayoutMode: "pan"` in
        app.json keeps the OS from also shifting things, so only one mechanism
        is ever in play.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {/* Outside the ScrollView, so it stays pinned while content moves. */}
        {header ? <View style={styles.header}>{header}</View> : null}

        {scrollable ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              body,
              contentContainerStyle,
              tabPad,
            ]}
            keyboardShouldPersistTaps="handled"
            // Swipe the keyboard away instead of hunting for a blank spot.
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, body, contentContainerStyle, tabPad]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const Screen = memo(ScreenComponent);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
  // Sits flush against the content below it; the first element on each screen
  // supplies the gap. Padding on both sides stacked into a dead band.
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
});
