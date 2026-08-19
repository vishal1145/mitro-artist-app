import { TAB_BAR_SPACE } from '@theme';

/**
 * Bottom padding a scrollable screen inside the tabs must reserve so its last
 * row clears the floating nav pill and the raised Live button above it.
 *
 * `Screen` renders inside a SafeAreaView with the bottom edge enabled, so the
 * safe-area inset is already applied outside this padding — adding it again
 * here would double-count. `TAB_BAR_SPACE` is measured from the bottom of the
 * safe area for exactly that reason.
 *
 * Prefer `<Screen tabBarSpacing />`, which applies this for you.
 */
export const useTabBarSpace = (): number => TAB_BAR_SPACE;
