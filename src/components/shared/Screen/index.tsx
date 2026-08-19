import { memo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@navigation/useTabBarSpace';
import { colors, spacing } from '@theme';

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
   * Reserve room for the floating tab bar. Required on any scrollable screen
   * inside the tabs, otherwise the last row is clipped behind the nav pill.
   */
  tabBarSpacing?: boolean;
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
  tabBarSpacing = false,
}: ScreenProps) => {
  const body = padded ? styles.padded : undefined;
  const tabSpace = useTabBarSpace();
  const tabPad = tabBarSpacing ? { paddingBottom: tabSpace } : undefined;

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {background ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {background}
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            showsVerticalScrollIndicator={false}
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
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
  },
});
