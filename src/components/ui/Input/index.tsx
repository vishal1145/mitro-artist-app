import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Text } from '@components/ui/Text';
import { colors, fontFamily, layout, radius, size, spacing, HIT_TARGET } from '@theme';
import { rf } from '@utils/responsive';

import type { InputProps } from './types';

/**
 * Event argument types are derived from TextInputProps rather than written out,
 * so they track React Native's own signatures across versions (RN 0.81 swapped
 * NativeSyntheticEvent<TextInputFocusEventData> for FocusEvent / BlurEvent).
 */
type FocusEventArg = Parameters<NonNullable<TextInputProps['onFocus']>>[0];
type BlurEventArg = Parameters<NonNullable<TextInputProps['onBlur']>>[0];

/**
 * Standardized, accessible text field. Meets the project Input contract:
 * visible label, error slot, password toggle, counter, 44pt target, a11y.
 * Errors are surfaced by the parent (on blur) via the `error` prop.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    labelRight,
    error,
    hint,
    isPassword = false,
    leftIcon,
    prefix,
    disabled = false,
    showCounter = false,
    maxLength,
    value,
    containerStyle,
    accessibilityHint,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  const handleFocus = useCallback(
    (event: FocusEventArg) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (event: BlurEventArg) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const hasError = Boolean(error);
  const count = value?.length ?? 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="label" color="fieldLabel">
            {label}
          </Text>
          {labelRight}
        </View>
      ) : null}

      <View
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          hasError ? styles.fieldError : null,
          disabled ? styles.fieldDisabled : null,
        ]}
      >
        {prefix ? (
          <View style={styles.prefix}>
            <Text variant="bodyLg" color="textSecondary">
              {prefix}
            </Text>
            <View style={styles.prefixRule} />
          </View>
        ) : leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={rf(18)}
            color={colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          ref={ref}
          value={value}
          editable={!disabled}
          maxLength={maxLength}
          secureTextEntry={hidden}
          placeholderTextColor={colors.inputPlaceholder}
          selectionColor={colors.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.input}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          {...rest}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.toggle}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={rf(20)}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Message row only occupies space when there is something to say. */}
      <View style={[styles.footer, hasError || hint || showCounter ? styles.footerSpaced : null]}>
        <View style={styles.footerMessage}>
          {hasError ? (
            <Text
              color="error"
              style={styles.message}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : hint ? (
            <Text color="textMuted" style={styles.message}>
              {hint}
            </Text>
          ) : null}
        </View>
        {showCounter && maxLength ? (
          <Text variant="caption" color="textMuted">
            {`${count}/${maxLength}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // No bottom margin — callers space fields with an explicit gap.
  container: {
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  // Spec: height 56, radius 18, input fill, 1.5px border, pink on focus.
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: size.input,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.input,
    paddingHorizontal: layout.inputPadding,
  },
  fieldFocused: {
    borderColor: colors.inputBorderFocused,
  },
  fieldError: {
    borderColor: colors.error,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  prefixRule: {
    width: 1,
    height: rf(20),
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.body,
    fontSize: rf(14),
    paddingVertical: spacing.sm,
  },
  toggle: {
    paddingLeft: spacing.xs,
    minWidth: HIT_TARGET / 2,
    alignItems: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // 6pt gap between the field and its message.
  footerSpaced: {
    marginTop: 6,
  },
  message: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  footerMessage: {
    flex: 1,
    paddingRight: spacing.xs,
  },
});
