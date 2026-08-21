import type { AxiosError } from 'axios';

import { logger } from './logger';

/**
 * Typed error extraction. Converts unknown thrown values (Axios errors,
 * native Errors, strings) into safe, user-friendly copy. Raw API/validation
 * messages are never surfaced to the user.
 */

export const ERROR_MESSAGES = {
  network: 'No internet connection. Please check your network and try again.',
  timeout: 'The request took too long. Please try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have permission to do that.",
  notFound: 'We couldn’t find what you were looking for.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  server: 'Something went wrong on our end. Please try again shortly.',
  validation: 'Please check the highlighted fields and try again.',
  unknown: 'Something went wrong. Please try again.',
} as const;

/**
 * An error whose message has already been through `normalizeError` and is
 * safe to show as-is.
 *
 * The service layer returns `Result<T>`, and the mutations rethrow the failure
 * branch as one of these. Without a marker class the message would be
 * normalized twice — the second pass sees a plain `Error`, can't tell it from
 * a genuine crash, and replaces "Phone already registered." with the generic
 * fallback.
 *
 * Lives here rather than beside the mutations so `@utils` stays a leaf.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Shape our API returns for errors (best-effort; all fields optional). */
interface ApiErrorBody {
  message?: string;
  error?: string;
  code?: string;
}

export interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError: boolean;
}

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorBody> =>
  typeof error === 'object' &&
  error !== null &&
  (error as AxiosError).isAxiosError === true;

const messageForStatus = (status: number): string => {
  if (status === 401) return ERROR_MESSAGES.unauthorized;
  if (status === 403) return ERROR_MESSAGES.forbidden;
  if (status === 404) return ERROR_MESSAGES.notFound;
  if (status === 422) return ERROR_MESSAGES.validation;
  if (status === 429) return ERROR_MESSAGES.rateLimited;
  if (status >= 500) return ERROR_MESSAGES.server;
  return ERROR_MESSAGES.unknown;
};

/**
 * Prefer the server's own message for 4xx responses.
 *
 * The API explains exactly what the user got wrong — "Account not found.
 * Check your phone number or stage name and try again." — which is far more
 * useful than the generic per-status copy. Without this, a failed login shows
 * "Your session has expired", because a rejected credential is also a 401.
 *
 * 5xx keeps the generic copy: those messages describe server internals and
 * shouldn't reach the user.
 */
const clientMessage = (status: number, body?: ApiErrorBody): string | null => {
  if (status >= 500) {
    return null;
  }
  const raw = body?.message ?? body?.error;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
};

/** Normalize any thrown value into a typed, safe error descriptor. */
export const normalizeError = (error: unknown): NormalizedError => {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return {
        message: ERROR_MESSAGES.timeout,
        code: error.code,
        isNetworkError: true,
      };
    }

    if (!error.response) {
      return {
        message: ERROR_MESSAGES.network,
        code: error.code,
        isNetworkError: true,
      };
    }

    const status = error.response.status;
    logger.warn('API error', {
      status,
      url: error.config?.url,
      code: error.response.data?.code,
    });

    return {
      message: clientMessage(status, error.response.data) ?? messageForStatus(status),
      status,
      code: error.response.data?.code,
      isNetworkError: false,
    };
  }

  // Already normalized once — pass the message straight through. It was
  // logged when it was first produced, so don't log it again as a crash.
  if (error instanceof AuthError) {
    return { message: error.message, isNetworkError: false };
  }

  if (error instanceof Error) {
    logger.error('Unhandled error', { name: error.name, message: error.message });
    return { message: ERROR_MESSAGES.unknown, isNetworkError: false };
  }

  logger.error('Unknown error value', { value: String(error) });
  return { message: ERROR_MESSAGES.unknown, isNetworkError: false };
};

/** Convenience: user-friendly string for any thrown value. */
export const getErrorMessage = (error: unknown): string =>
  normalizeError(error).message;
