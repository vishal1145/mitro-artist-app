import { Children, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

/* -------------------------------------------------------------------------- */
/* Two-column grid — CSS Grid `repeat(2, minmax(0, 1fr))` for the stat tiles.  */
/* Flexbox would stretch a lone trailing tile; measuring the row and pinning   */
/* each cell to `(width - gap) / 2` keeps the two-up shape and a fixed gap.     */
/* -------------------------------------------------------------------------- */

interface TwoColGridProps {
  gap: number;
  children: ReactNode;
}

export const TwoColGrid = ({ gap, children }: TwoColGridProps) => {
  const [rowWidth, setRowWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width);
  const cellWidth = rowWidth > 0 ? (rowWidth - gap) / 2 : undefined;

  return (
    <View style={[styles.grid, { gap }]} onLayout={onLayout}>
      {Children.map(children, (child) =>
        child == null ? null : <View style={{ width: cellWidth }}>{child}</View>,
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
