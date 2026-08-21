import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { authApi } from '@services/api';
import { useAuthStore } from '@store';
import type {
  AuthSession,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
} from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * Auth mutations.
 *
 * `authApi` returns the `Result<T>` union rather than throwing, so each
 * mutation unwraps it and throws on failure — that's what lets React Query
 * drive `isPending` / `error` the way the screens expect.
 *
 * Every one sets `retry: false`. These failures are decisions the server has
 * made — wrong password, number taken, expired code — and repeating the call
 * just delays the same answer.
 */

/**
 * Re-exported for the screens that already import it from here. It's defined
 * in `@utils/errorHandler` so that `normalizeError` can recognise it without
 * `@utils` depending on `@hooks`.
 */
export { AuthError };

/** Unwrap a `Result<T>`, throwing the display-ready message on failure. */
const unwrap = async <T>(
  call: Promise<{ success: true; data: T } | { success: false; error: string }>,
): Promise<T> => {
  const result = await call;
  if (!result.success) {
    throw new AuthError(result.error);
  }
  return result.data;
};

/* ------------------------------ Sign in --------------------------------- */

export const useLoginMutation = (): UseMutationResult<
  AuthSession,
  Error,
  LoginPayload
> => {
  const authenticate = useAuthStore((s) => s.authenticate);

  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (payload: LoginPayload) => unwrap(authApi.login(payload)),
    // Persist the token and flip the nav guard before the screen navigates.
    onSuccess: async (session) => {
      await authenticate(session);
    },
    retry: false,
  });
};

/* ------------------------------ Sign up --------------------------------- */

/** Sign-up step 1 — texts a code to the number being registered. */
export const useSendRegistrationOtpMutation = (): UseMutationResult<
  SendOtpResponse,
  Error,
  SendOtpPayload
> =>
  useMutation({
    mutationKey: ['auth', 'sendRegistrationOtp'],
    mutationFn: (payload: SendOtpPayload) =>
      unwrap(authApi.sendRegistrationOtp(payload)),
    retry: false,
  });

/** Sign-up step 2 — marks the phone verified. Returns no token. */
export const useVerifyRegistrationOtpMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  VerifyOtpPayload
> =>
  useMutation({
    mutationKey: ['auth', 'verifyRegistrationOtp'],
    mutationFn: (payload: VerifyOtpPayload) =>
      unwrap(authApi.verifyRegistrationOtp(payload)),
    retry: false,
  });

/**
 * Sign-up step 3 — creates the artist and returns a session.
 *
 * Only valid straight after step 2: the server's phone-verification window is
 * short, and a late call comes back "Phone verification expired."
 */
export const useRegisterMutation = (): UseMutationResult<
  AuthSession,
  Error,
  RegisterPayload
> => {
  const authenticate = useAuthStore((s) => s.authenticate);

  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: (payload: RegisterPayload) => unwrap(authApi.register(payload)),
    // Register returns a token, so the artist is signed in the moment this
    // resolves.
    onSuccess: async (session) => {
      await authenticate(session);
    },
    retry: false,
  });
};

/* --------------------------- Password reset ------------------------------ */

/** Reset step 1. */
export const useSendPasswordResetOtpMutation = (): UseMutationResult<
  SendOtpResponse,
  Error,
  SendOtpPayload
> =>
  useMutation({
    mutationKey: ['auth', 'sendPasswordResetOtp'],
    mutationFn: (payload: SendOtpPayload) =>
      unwrap(authApi.sendPasswordResetOtp(payload)),
    retry: false,
  });

/** Reset step 2. */
export const useVerifyPasswordResetOtpMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  VerifyOtpPayload
> =>
  useMutation({
    mutationKey: ['auth', 'verifyPasswordResetOtp'],
    mutationFn: (payload: VerifyOtpPayload) =>
      unwrap(authApi.verifyPasswordResetOtp(payload)),
    retry: false,
  });

/**
 * Reset step 3. No session comes back — the artist signs in afterwards with
 * the password they just set.
 */
export const useResetPasswordMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  ResetPasswordPayload
> =>
  useMutation({
    mutationKey: ['auth', 'resetPassword'],
    mutationFn: (payload: ResetPasswordPayload) =>
      unwrap(authApi.resetPassword(payload)),
    retry: false,
  });
