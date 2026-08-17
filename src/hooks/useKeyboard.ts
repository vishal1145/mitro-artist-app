import { useEffect, useState } from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';

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
