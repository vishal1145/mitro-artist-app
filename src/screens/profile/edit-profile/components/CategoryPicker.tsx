import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { LucideIcon } from '@components/ui/LucideIcon';
import type { ArtistCategory } from '@app-types/api';

import { C } from '../colors';
import { styles } from '../styles';
import { FieldLabel, FieldRow } from './Field';

export const CategoryPicker = ({
  categories,
  categoryId,
  onSelect,
}: {
  categories: ArtistCategory[];
  categoryId: string;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === categoryId);
  return (
    <View style={styles.field}>
      <FieldLabel>Primary Category</FieldLabel>
      <Pressable onPress={() => setOpen(true)}>
        <FieldRow icon="layout-dashboard">
          <Text
            style={[styles.input, !selected ? { color: C.dim } : null]}
            numberOfLines={1}
          >
            {selected ? selected.name : 'Select Primary Category'}
          </Text>
          <LucideIcon name="chevron-down" size={16} color={C.dim} />
        </FieldRow>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select Primary Category</Text>
            <Pressable
              style={styles.pickerRow}
              onPress={() => {
                onSelect('');
                setOpen(false);
              }}
            >
              <Text style={[styles.pickerRowText, { color: C.dim }]}>Select Primary Category</Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.pickerRow}
                onPress={() => {
                  onSelect(cat.id);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerRowText,
                    cat.id === categoryId ? { color: C.pink } : null,
                  ]}
                >
                  {cat.name}
                </Text>
                {cat.id === categoryId ? (
                  <LucideIcon name="check" size={16} color={C.pink} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
