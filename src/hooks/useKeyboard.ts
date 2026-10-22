import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardInfo {
  visible: boolean;
  height: number;
}

/** Tracks keyboard visibility and height for layout adjustments. */
export const useKeyboard = (): KeyboardInfo => {
  const [info, setInfo] = useState<KeyboardInfo>({ visible: false, height: 0 });

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent): void => {
      setInfo({ visible: true, height: event.endCoordinates.height });
    };
    const onHide = (): void => {
      setInfo({ visible: false, height: 0 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return info;
};

/**
 * How far the keyboard covers the screen from the bottom edge (0 when closed).
 * Android (edge-to-edge) reports the height without the nav-bar strip, so the
 * bottom inset is added back; iOS already reports the full height.
 */
export const useKeyboardOverlap = (): number => {
  const [kb, setKb] = useState({ height: 0, screenY: 0 });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKb({ height: event.endCoordinates?.height ?? 0, screenY: event.endCoordinates?.screenY ?? 0 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKb({ height: 0, screenY: 0 }));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (kb.height <= 0) return 0;
  if (Platform.OS !== 'android') return kb.height;
  // Two independent estimates of how far the keyboard reaches up from the
  // bottom edge of the screen; the larger one wins so the composer can never
  // end up under the keyboard:
  //  - reported height + nav-bar inset (RN strips the nav bar from the height)
  //  - screen height - keyboard top (screenY is the top edge in screen dp)
  const fromInsets = kb.height + insets.bottom;
  const fromFrame = kb.screenY > 0 ? Dimensions.get('screen').height - kb.screenY : 0;
  return Math.max(fromInsets, fromFrame);
};
