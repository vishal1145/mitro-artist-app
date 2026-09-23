import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { LucideIcon, Text } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from '../styles';
import { ACCOUNT_TYPE_OPTIONS } from '../types';

/** `.field` with a `<select>` on the web — here a tap-to-open Modal picker that
 *  keeps the `.field-input` look. */
export const AccountTypeField = ({
  value,
  onChange,
  editable,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const options = ACCOUNT_TYPE_OPTIONS;
  const selected = options.find((o) => o.key === value) ?? options[0];
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Account Type</Text>
      <Pressable
        onPress={editable ? () => setOpen(true) : undefined}
        disabled={!editable}
        style={[styles.fieldInput, editable ? null : styles.fieldInputDisabled]}
      >
        <Text numberOfLines={1} style={styles.fieldValue}>
          {selected.label}
        </Text>
        <LucideIcon name="chevron-down" size={rf(16)} color={webColors.dim} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Account Type</Text>
            {options.map((opt) => (
              <Pressable
                key={opt.key}
                style={styles.pickerRow}
                onPress={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                <Text
                  style={[styles.pickerRowText, opt.key === value ? styles.pickerRowTextActive : null]}
                >
                  {opt.label}
                </Text>
                {opt.key === value ? (
                  <LucideIcon name="check" size={rf(16)} color={webColors.purple} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
