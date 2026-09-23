import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DIAG_END, DIAG_START, HOT_STOPS, web } from '../webTokens';

/* -------------------------------------------------------------------------- */
/*  .gsched-switch                                                             */
/* -------------------------------------------------------------------------- */

interface SwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
}

const GschedSwitchComponent = ({ value, onValueChange, accessibilityLabel }: SwitchProps) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    accessibilityRole="switch"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ checked: value }}
    style={styles.switch}
  >
    {value ? (
      <LinearGradient
        colors={HOT_STOPS}
        start={DIAG_START}
        end={DIAG_END}
        style={styles.switchTrackFill}
      />
    ) : (
      <View style={styles.switchTrackOff} />
    )}
    <View style={[styles.switchKnob, value ? styles.switchKnobOn : null]} />
  </Pressable>
);

export const GschedSwitch = memo(GschedSwitchComponent);
GschedSwitch.displayName = 'GschedSwitch';

/* .gsched-switch */
const styles = StyleSheet.create({
  switch: {
    width: 40,
    height: 22,
    borderRadius: 999,
    justifyContent: 'center',
  },
  switchTrackFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  switchTrackOff: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: web.switchTrack,
  },
  switchKnob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: web.white,
  },
  switchKnobOn: {
    transform: [{ translateX: 18 }],
  },
});
