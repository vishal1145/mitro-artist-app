import { Pressable, TextInput, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { sliceWinPercent } from '../schema';
import { styles } from '../styles';
import type { Slice } from '../types';

/** One editable fun-wheel activity row — extracted from the inline
 *  `slices.map()`. */
export const ActivityRow = ({
  slice,
  editable,
  totalWeight,
  updateSliceName,
  updateSliceWeight,
  removeSlice,
}: {
  slice: Slice;
  editable: boolean;
  totalWeight: number;
  updateSliceName: (id: string, val: string) => void;
  updateSliceWeight: (id: string, val: string) => void;
  removeSlice: (id: string) => void;
}) => (
  <View style={styles.activityRow}>
    <TextInput
      value={slice.activityName}
      onChangeText={(t) => updateSliceName(slice.id, t)}
      placeholder="Write your activity"
      placeholderTextColor={webColors.dim}
      editable={editable}
      style={styles.activityNameInput}
      accessibilityLabel="Activity name"
    />
    <TextInput
      value={slice.weight}
      onChangeText={(t) => updateSliceWeight(slice.id, t)}
      keyboardType="number-pad"
      editable={editable}
      style={styles.weightField}
      accessibilityLabel="Activity weight"
    />
    <Text style={styles.activityPct}>
      {slice.activityName ? `${sliceWinPercent(slice.weight, totalWeight)}%` : '—'}
    </Text>
    <Pressable
      onPress={() => removeSlice(slice.id)}
      hitSlop={8}
      style={styles.activityRm}
      accessibilityRole="button"
      accessibilityLabel="Remove activity"
    >
      <LucideIcon name="x" size={rf(14)} color={webColors.dim} />
    </Pressable>
  </View>
);
