import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { LucideIcon } from '@components/ui/LucideIcon';
import type { ArtistSubcategory } from '@app-types/api';

import { C } from '../colors';
import { styles } from '../styles';
import { FieldLabel, FieldRow } from './Field';

/**
 * Second level under the primary category.
 *
 * The list comes from `GET /api/artist/subcategories?categoryId=…`, so it only
 * has anything to show once a primary category is chosen — until then the row
 * reads "Select Primary Category first" and doesn't open.
 */
export const SubCategoryPicker = ({
  subcategories,
  subcategoryId,
  categoryId,
  isLoading,
  onSelect,
}: {
  subcategories: ArtistSubcategory[];
  subcategoryId: string;
  categoryId: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = subcategories.find((s) => s.id === subcategoryId);
  const disabled = !categoryId || (isLoading && subcategories.length === 0);

  const placeholder = !categoryId
    ? 'Select Primary Category first'
    : isLoading
      ? 'Loading…'
      : 'Select Sub Category';

  return (
    <View style={styles.field}>
      <FieldLabel>Sub Category</FieldLabel>
      <Pressable onPress={() => !disabled && setOpen(true)} disabled={disabled}>
        <FieldRow icon="layout-dashboard">
          <Text
            style={[styles.input, !selected ? { color: C.dim } : null]}
            numberOfLines={1}
          >
            {selected ? selected.name : placeholder}
          </Text>
          <LucideIcon name="chevron-down" size={16} color={C.dim} />
        </FieldRow>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select Sub Category</Text>
            <Pressable
              style={styles.pickerRow}
              onPress={() => {
                onSelect('');
                setOpen(false);
              }}
            >
              <Text style={[styles.pickerRowText, { color: C.dim }]}>Select Sub Category</Text>
            </Pressable>
            {subcategories.map((sub) => (
              <Pressable
                key={sub.id}
                style={styles.pickerRow}
                onPress={() => {
                  onSelect(sub.id);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerRowText,
                    sub.id === subcategoryId ? { color: C.pink } : null,
                  ]}
                >
                  {sub.name}
                </Text>
                {sub.id === subcategoryId ? (
                  <LucideIcon name="check" size={16} color={C.pink} />
                ) : null}
              </Pressable>
            ))}
            {subcategories.length === 0 && !isLoading ? (
              <Text style={[styles.pickerRowText, { color: C.dim }]}>
                No sub categories for this category.
              </Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
