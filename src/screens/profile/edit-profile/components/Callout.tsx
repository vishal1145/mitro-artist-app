import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LucideIcon, type LucideIconName } from '@components/ui/LucideIcon';

import { C } from '../colors';
import { styles } from '../styles';
import type { CalloutTone } from '../types';

const CALLOUT_TONE: Record<CalloutTone, { bg: string; border: string; accent: string; icon: LucideIconName }> = {
  cyan: { bg: 'rgba(52,231,255,0.06)', border: 'rgba(52,231,255,0.25)', accent: C.cyan, icon: 'info' },
  gold: { bg: 'rgba(255,200,107,0.06)', border: 'rgba(255,200,107,0.3)', accent: C.gold, icon: 'lock' },
  green: { bg: 'rgba(66,245,167,0.06)', border: 'rgba(66,245,167,0.28)', accent: C.green, icon: 'image' },
};

export const Callout = ({
  tone,
  icon,
  children,
  style,
}: {
  tone: CalloutTone;
  icon?: LucideIconName;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const t = CALLOUT_TONE[tone];
  return (
    <View
      style={[
        styles.callout,
        { backgroundColor: t.bg, borderColor: t.border, borderLeftColor: t.accent },
        style,
      ]}
    >
      <LucideIcon name={icon ?? t.icon} size={15} color={t.accent} />
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
};
