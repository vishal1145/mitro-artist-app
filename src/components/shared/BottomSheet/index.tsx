import { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@components/ui/Text';
import { colors, radius, spacing } from '@theme';
import { SCREEN, wp } from '@utils/responsive';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Heights as a fraction of screen height, ascending (e.g. [0.4, 0.9]).
   * Dragging past the smallest snap dismisses the sheet.
   */
  snapPoints?: readonly number[];
  /** Index into `snapPoints` to open at. */
  initialSnap?: number;
  title?: string;
  /** Hide the grab handle (also disables drag-to-dismiss). */
  showHandle?: boolean;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_SNAPS = [0.5] as const;
/** Drag distance past which a release dismisses rather than springs back. */
const DISMISS_THRESHOLD = wp(18);
const FLING_VELOCITY = 0.5;

/**
 * Modal bottom sheet with snap points, a dimmed backdrop and drag-to-dismiss.
 * Built on RN core primitives so it needs no extra gesture dependency.
 */
const BottomSheetComponent = ({
  visible,
  onClose,
  snapPoints = DEFAULT_SNAPS,
  initialSnap = 0,
  title,
  showHandle = true,
  children,
  contentStyle,
}: BottomSheetProps) => {
  const insets = useSafeAreaInsets();

  // Ascending, clamped to a sane range.
  const snaps = useMemo(
    () =>
      [...snapPoints]
        .map((p) => Math.min(Math.max(p, 0.2), 0.95))
        .sort((a, b) => a - b),
    [snapPoints],
  );

  const sheetHeight = SCREEN.height * snaps[snaps.length - 1];

  /** Resting offset for a snap index — 0 means fully expanded. */
  const offsetFor = useCallback(
    (index: number) => sheetHeight - SCREEN.height * snaps[index],
    [sheetHeight, snaps],
  );

  const startIndex = Math.min(Math.max(initialSnap, 0), snaps.length - 1);

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  /** Resting offset the current drag started from. */
  const restOffset = useRef(sheetHeight);

  const animateTo = useCallback(
    (toValue: number, fade: number) => {
      restOffset.current = toValue;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
          mass: 0.7,
        }),
        Animated.timing(backdrop, {
          toValue: fade,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [translateY, backdrop],
  );

  const close = useCallback(() => {
    animateTo(sheetHeight, 0);
    onClose();
  }, [animateTo, sheetHeight, onClose]);

  useEffect(() => {
    if (visible) {
      animateTo(offsetFor(startIndex), 1);
    } else {
      animateTo(sheetHeight, 0);
    }
  }, [visible, animateTo, offsetFor, startIndex, sheetHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          showHandle && Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_evt, gesture) => {
          const next = restOffset.current + gesture.dy;
          // Never drag above the tallest snap.
          translateY.setValue(Math.max(next, 0));
        },
        onPanResponderRelease: (_evt, gesture) => {
          const dragged = restOffset.current + gesture.dy;
          const dismissing =
            gesture.dy > DISMISS_THRESHOLD || gesture.vy > FLING_VELOCITY;

          // Below the smallest snap (or flung down) -> dismiss.
          if (dismissing && restOffset.current >= offsetFor(0) - 1) {
            close();
            return;
          }

          // Otherwise settle on whichever snap is nearest.
          let nearest = 0;
          let best = Number.POSITIVE_INFINITY;
          snaps.forEach((_snap, i) => {
            const distance = Math.abs(offsetFor(i) - dragged);
            if (distance < best) {
              best = distance;
              nearest = i;
            }
          });
          animateTo(offsetFor(nearest), 1);
        },
      }),
    [showHandle, translateY, offsetFor, snaps, animateTo, close],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          {showHandle ? (
            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
          ) : null}

          {title ? (
            <Text variant="h3" style={styles.title}>
              {title}
            </Text>
          ) : null}

          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const BottomSheet = memo(BottomSheetComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: wp(11),
    height: wp(1),
    borderRadius: radius.full,
    backgroundColor: colors.textDisabled,
  },
  title: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
