import type { RegisterPayload } from '@app-types/api';

/**
 * Holds the credentials typed on the register screen until the OTP screen has
 * verified the phone and can complete `POST /register`.
 *
 * Deliberately module-scoped rather than a route param: Expo Router keeps
 * params in navigation state, which means the password would sit in the URL,
 * in deep-link history and in any navigation logging. This lives in memory
 * only and dies with the process.
 */
let pending: RegisterPayload | null = null;

export const setPendingRegistration = (value: RegisterPayload): void => {
  pending = value;
};

/**
 * Reads without consuming: a wrong OTP has to be retryable, and the artist
 * shouldn't have to retype their details for a mistyped digit. The caller
 * clears explicitly once the account exists.
 */
export const getPendingRegistration = (): RegisterPayload | null => pending;

export const clearPendingRegistration = (): void => {
  pending = null;
};
