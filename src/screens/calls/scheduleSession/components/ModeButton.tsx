import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@components/ui';
import { rf } from '@utils/responsive';
import { typography } from '@theme';

import type { FeatherIconName } from '../types';
import { DIAG_END, DIAG_START, HOT_STOPS, web } from '../webTokens';

/* -------------------------------------------------------------------------- */
/*  .gcall-mode-toggle                                                         */
/* -------------------------------------------------------------------------- */

interface ModeButtonProps {
  icon: FeatherIconName;
  label: string;
  active: boolean;
  onPress: () => void;
}

const ModeButtonComponent = ({ icon, label, active, onPress }: ModeButtonProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected: active }}
    style={[styles.modeBtn, active ? styles.modeBtnActive : styles.modeBtnIdle]}
  >
    {active ? (
      <LinearGradient
        colors={HOT_STOPS}
        start={DIAG_START}
        end={DIAG_END}
        style={StyleSheet.absoluteFill}
      />
    ) : null}
    <Feather name={icon} size={rf(18)} color={active ? web.white : web.textSoft} />
    <Text style={active ? styles.modeTextActive : styles.modeText}>{label}</Text>
  </Pressable>
);

export const ModeButton = memo(ModeButtonComponent);
ModeButton.displayName = 'ModeButton';

const styles = StyleSheet.create({
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeBtnIdle: {
    borderColor: web.modeIdleBorder,
    backgroundColor: web.modeIdleBg,
  },
  modeBtnActive: {
    borderColor: web.transparent,
    backgroundColor: web.transparent,
    shadowColor: web.pinkGlow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 13,
    elevation: 6,
  },
  modeText: {
    ...typography.body,
    color: web.textSoft,
  },
  modeTextActive: {
    ...typography.body,
    color: web.white,
  },
});
