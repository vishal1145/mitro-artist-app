import { Pressable, Switch, TextInput, View } from 'react-native';

import { LucideIcon } from '@components/ui';
import { palette, webColors } from '@theme';
import { rf } from '@utils/responsive';

import { sanitizeDigits } from '../schema';
import { styles } from '../styles';
import type { RewardRow } from '../types';

/** One editable row of the Reward Menu table — extracted from the inline
 *  `rewardRows.map()`. */
export const RewardTableRow = ({
  row,
  updateRewardRow,
  removeRewardRow,
}: {
  row: RewardRow;
  updateRewardRow: (
    id: string | number,
    field: 'name' | 'price' | 'isActive',
    value: string | boolean,
  ) => void;
  removeRewardRow: (id: string | number) => void;
}) => (
  <View style={styles.rewardRow}>
    <TextInput
      value={row.name}
      onChangeText={(t) => updateRewardRow(row.id, 'name', t)}
      placeholder="Reward Name (e.g. Shoutout)"
      placeholderTextColor={webColors.dim}
      style={styles.rewardInput}
      accessibilityLabel="Reward name"
    />
    <TextInput
      value={row.price}
      onChangeText={(t) => updateRewardRow(row.id, 'price', sanitizeDigits(t))}
      placeholder="Coins"
      placeholderTextColor={webColors.dim}
      keyboardType="number-pad"
      style={styles.rewardPriceInput}
      accessibilityLabel="Reward price in coins"
    />
    <View style={styles.switchCell}>
      <Switch
        value={row.isActive}
        onValueChange={(next) => updateRewardRow(row.id, 'isActive', next)}
        trackColor={{ false: webColors.panelBorder, true: webColors.pinkHot }}
        thumbColor={palette.white}
        accessibilityLabel={`${row.name || 'Reward'} status`}
      />
    </View>
    {typeof row.id === 'number' ? (
      <Pressable
        onPress={() => removeRewardRow(row.id)}
        hitSlop={8}
        style={styles.rewardRm}
        accessibilityRole="button"
        accessibilityLabel="Remove reward"
      >
        <LucideIcon name="x" size={rf(14)} color={webColors.dim} />
      </Pressable>
    ) : (
      <View style={styles.headCellGap} />
    )}
  </View>
);
