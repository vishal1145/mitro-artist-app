import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, TextInput, View } from 'react-native';

import { LucideIcon } from '@components/ui/LucideIcon';

import { C } from '../colors';
import { styles } from '../styles';
import { useChangePasswordSection } from '../useChangePasswordSection';
import { FieldLabel, FieldRow } from './Field';

const PwField = ({
  label,
  placeholder,
  value,
  onChangeText,
  show,
  toggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  toggle: () => void;
}) => (
  <View style={styles.field}>
    <FieldLabel>{label}</FieldLabel>
    <FieldRow icon="lock">
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      <Pressable onPress={toggle} hitSlop={8}>
        <LucideIcon name={show ? 'eye' : 'eye-off'} size={15} color={C.dim} />
      </Pressable>
    </FieldRow>
  </View>
);

export const ChangePasswordSection = () => {
  const {
    open,
    toggleOpen,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showOld,
    toggleShowOld,
    showNew,
    toggleShowNew,
    showConfirm,
    toggleShowConfirm,
    passRules,
    handleUpdatePassword,
    isPending,
    disabled,
    handleCancel,
  } = useChangePasswordSection();

  return (
    <View>
      <Pressable style={styles.pwToggle} onPress={toggleOpen}>
        <Text style={styles.pwToggleText}>Change Password</Text>
        <View style={open ? { transform: [{ rotate: '180deg' }] } : null}>
          <LucideIcon name="chevron-down" size={16} color={C.text} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.pwBody}>
          <PwField
            label="Current Password"
            placeholder="Current Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            show={showOld}
            toggle={toggleShowOld}
          />
          <PwField
            label="New Password"
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            show={showNew}
            toggle={toggleShowNew}
          />
          {newPassword ? (
            <View style={styles.passRules}>
              {passRules.map((r) => (
                <View key={r.label} style={styles.passRuleRow}>
                  <LucideIcon
                    name={r.ok ? 'check' : 'x'}
                    size={14}
                    color={r.ok ? '#34d399' : 'rgba(255,255,255,0.45)'}
                  />
                  <Text style={[styles.passRuleText, r.ok ? { color: '#34d399' } : null]}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <PwField
            label="Confirm New Password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            show={showConfirm}
            toggle={toggleShowConfirm}
          />
          <View style={styles.pwActions}>
            <Pressable
              style={[styles.btnPrimarySm, disabled ? { opacity: 0.6 } : null]}
              onPress={handleUpdatePassword}
              disabled={disabled}
            >
              <LinearGradient
                colors={[C.pink, C.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnPrimarySmFill}
              >
                <Text style={styles.btnPrimaryText}>
                  {isPending ? 'Updating...' : 'Update Password'}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.btnGhostSm} onPress={handleCancel}>
              <Text style={styles.btnGhostSmText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};
