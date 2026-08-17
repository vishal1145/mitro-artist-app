import { Dimensions, PixelRatio } from 'react-native';

/**
 * Responsive scaling helpers.
 *
 * Design baseline is a 375pt-wide device (iPhone X / 11 / 12 class).
 * Scaling is clamped to a 1.3x cap so fonts and spacing don't blow up on
 * tablets while still adapting up from small phones.
 *
 * Usage rules (enforced project-wide):
 *  - font sizes      -> rf()
 *  - padding/margin  -> wp() or hp()
 *  - width/height    -> wp() / hp() / flex
 *  - border radius   -> wp()
 * Never hardcode raw pixel values in StyleSheet.
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const MAX_SCALE = 1.3;

/** Raw screen dimensions, exported for edge cases (e.g. full-bleed images). */
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} as const;

/** Percentage of screen width -> device-independent pixels. */
export const wp = (percentage: number): number => {
  const value = (SCREEN_WIDTH * percentage) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/** Percentage of screen height -> device-independent pixels. */
export const hp = (percentage: number): number => {
  const value = (SCREEN_HEIGHT * percentage) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/** Responsive font size, scaled from the 375pt baseline and clamped. */
export const rf = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, MAX_SCALE);
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/** True on wider viewports (tablets, large foldables). */
export const isTablet = (): boolean => SCREEN_WIDTH >= 768;
