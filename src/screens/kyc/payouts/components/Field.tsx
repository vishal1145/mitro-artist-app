import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { LucideIcon, Text, type LucideIconName } from '@components/ui';
import { webColors } from '@theme';
import { rf } from '@utils/responsive';

import { styles } from '../styles';

/** `.field` + `.field-input`, now an editable `<TextInput>` keeping the exact
 *  container styling. Values arrive masked from the API and are prefilled. */
export const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  editable = true,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon?: LucideIconName;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldInput, editable ? null : styles.fieldInputDisabled]}>
      {icon ? <LucideIcon name={icon} size={rf(14)} color={webColors.dim} /> : null}
      <TextInput
        style={[styles.fieldValue, styles.fieldInputText]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={webColors.placeholderInk}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  </View>
);
