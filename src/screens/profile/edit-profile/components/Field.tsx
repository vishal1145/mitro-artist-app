import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { LucideIcon, type LucideIconName } from '@components/ui/LucideIcon';

import { C } from '../colors';
import { styles } from '../styles';

export const FieldLabel = ({ children }: { children: ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

export const FieldRow = ({
  icon,
  iconTop,
  children,
}: {
  icon: LucideIconName;
  iconTop?: boolean;
  children: ReactNode;
}) => (
  <View style={[styles.fieldInput, iconTop ? styles.fieldInputTop : null]}>
    <View style={iconTop ? styles.iconTop : null}>
      <LucideIcon name={icon} size={14} color={C.dim} />
    </View>
    {children}
  </View>
);
