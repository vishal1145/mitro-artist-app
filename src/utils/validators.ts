import { z } from 'zod';

/**
 * Shared Zod field rules — the single source of truth for validation limits.
 * Screen-level schemas compose these so limits stay consistent everywhere.
 * Limits mirror the project validation spec exactly.
 */

export const LIMITS = {
  name: { min: 2, max: 50 },
  email: { max: 255 },
  password: { min: 8, max: 64 },
  username: { min: 3, max: 30 },
  otp: { length: 6 },
  search: { min: 1, max: 100 },
  textarea: { min: 10, max: 500 },
  phone: { max: 16 },
} as const;

const NAME_REGEX = /^[A-Za-z\s]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
const OTP_REGEX = /^\d{6}$/;
const PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;
const PASSWORD_UPPER = /[A-Z]/;
const PASSWORD_LOWER = /[a-z]/;
const PASSWORD_DIGIT = /\d/;
const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;

export const nameSchema = z
  .string()
  .trim()
  .min(LIMITS.name.min, 'Please enter your name.')
  .max(LIMITS.name.max, `Name must be under ${LIMITS.name.max} characters.`)
  .regex(NAME_REGEX, 'Use letters and spaces only.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(LIMITS.email.max, 'That email is too long.')
  .email('Enter a valid email address.');

export const passwordSchema = z
  .string()
  .min(LIMITS.password.min, `Use at least ${LIMITS.password.min} characters.`)
  .max(LIMITS.password.max, `Keep it under ${LIMITS.password.max} characters.`)
  .regex(PASSWORD_UPPER, 'Add an uppercase letter.')
  .regex(PASSWORD_LOWER, 'Add a lowercase letter.')
  .regex(PASSWORD_DIGIT, 'Add a number.')
  .regex(PASSWORD_SPECIAL, 'Add a special character.');

export const usernameSchema = z
  .string()
  .trim()
  .min(LIMITS.username.min, `At least ${LIMITS.username.min} characters.`)
  .max(LIMITS.username.max, `At most ${LIMITS.username.max} characters.`)
  .regex(USERNAME_REGEX, 'Letters, numbers and underscores only.');

export const otpSchema = z
  .string()
  .length(LIMITS.otp.length, 'Enter the 6-digit code.')
  .regex(OTP_REGEX, 'The code must be 6 digits.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_E164_REGEX, 'Enter a valid phone number with country code.');

/* -------------------------------------------------------------------------- */
/*  Auth field rules (Mitro user-app parity)                                  */
/* -------------------------------------------------------------------------- */

const MOBILE_REGEX = /^\d{10}$/;
const STAGE_NAME_REGEX = /^[a-z0-9_]+$/;

/** 10-digit national mobile number (dial code is shown as a static prefix). */
export const mobileSchema = z
  .string()
  .trim()
  .regex(MOBILE_REGEX, 'Enter a valid 10-digit mobile number');

/** Sign-in / sign-up password — length only; complexity is advisory. */
export const authPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

/** Public display name. */
export const displayNameSchema = z
  .string()
  .trim()
  .min(3, 'Display name must be 3-24 characters')
  .max(24, 'Display name must be 3-24 characters');

/** Handle: lowercase letters, numbers and underscores only. */
export const stageNameSchema = z
  .string()
  .trim()
  .min(3, 'Letters, numbers and underscores only')
  .max(20, 'Letters, numbers and underscores only')
  .regex(STAGE_NAME_REGEX, 'Letters, numbers and underscores only');

/**
 * Password strength 0..3 for the sign-up meter:
 * 8+ characters, contains a number, contains a symbol.
 */
export const authPasswordStrength = (value: string): number => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (PASSWORD_DIGIT.test(value)) score += 1;
  if (PASSWORD_SPECIAL.test(value)) score += 1;
  return score;
};

export const searchSchema = z
  .string()
  .trim()
  .min(LIMITS.search.min)
  .max(LIMITS.search.max);

export const textareaSchema = z
  .string()
  .trim()
  .min(LIMITS.textarea.min, `At least ${LIMITS.textarea.min} characters.`)
  .max(LIMITS.textarea.max, `At most ${LIMITS.textarea.max} characters.`);

/** Password strength score 0..4 for a live strength meter. */
export const passwordStrength = (value: string): number => {
  let score = 0;
  if (value.length >= LIMITS.password.min) score += 1;
  if (PASSWORD_UPPER.test(value) && PASSWORD_LOWER.test(value)) score += 1;
  if (PASSWORD_DIGIT.test(value)) score += 1;
  if (PASSWORD_SPECIAL.test(value)) score += 1;
  return score;
};
