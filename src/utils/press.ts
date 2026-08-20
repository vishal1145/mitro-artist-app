import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.62,
  },
});

/**
 * Style callback that dims a `Pressable` while it's held.
 *
 * Usage: `<Pressable style={pressable(styles.row)} />`. Keeping this in one
 * place means every tappable surface gives the same feedback, and screens
 * don't each hand-roll a `({ pressed }) => ...` closure.
 */
export const pressable =
  (base?: StyleProp<ViewStyle>) =>
  ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> =>
    [base, pressed ? styles.pressed : null];
