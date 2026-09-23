import { Children, useState, type ReactNode } from 'react';
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { styles } from './styles';

/**
 * `grid-template-columns: repeat(2, minmax(0, 1fr))` — the shape both
 * `.summary-strip` and `.metric-grid` take below 760px.
 *
 * Flexbox with `flexGrow` would stretch a lone trailing item to full width;
 * CSS Grid leaves it in column one at half width. So the row is measured once
 * and each cell is given the exact `(width - gap) / 2`, which also keeps the
 * column gap at a fixed 12/10px instead of drifting with the screen.
 */
export const TwoColGrid = ({
  gap,
  children,
  style,
}: {
  gap: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const [rowWidth, setRowWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width);
  const cellWidth = rowWidth > 0 ? (rowWidth - gap) / 2 : undefined;

  return (
    <View style={[styles.grid, { gap }, style]} onLayout={onLayout}>
      {Children.map(children, (child) =>
        child == null ? null : <View style={{ width: cellWidth }}>{child}</View>,
      )}
    </View>
  );
};
