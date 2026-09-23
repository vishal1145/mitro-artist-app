import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from '../styles';

/** `.acc-item.open` — every section renders expanded on the web. */
export const AccItem = ({
  icon,
  title,
  done,
  children,
}: {
  icon: LucideIconName;
  title: string;
  done: boolean;
  children: ReactNode;
}) => (
  <View style={styles.accItem}>
    <View style={styles.accHead}>
      <View style={styles.accHeadTitle}>
        <LucideIcon name={icon} size={rf(15)} color={webColors.purple} />
        <Text style={styles.accTitle}>{title}</Text>
      </View>
      <View style={[styles.accChip, done ? styles.accChipDone : null]}>
        <Text style={[styles.accChipText, done ? styles.accChipTextDone : null]}>
          {done ? '✓ Complete' : 'Not started'}
        </Text>
      </View>
    </View>
    <View style={styles.accBodyInner}>{children}</View>
  </View>
);
