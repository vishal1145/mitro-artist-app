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

/**
 * Shape our API returns for errors (best-effort; all fields optional).
 *
 * The artist API is ASP.NET, so a failed model binding comes back as RFC 9110
 * ProblemDetails — `title` + `errors`, and no `message` at all:
 *
 *   { "title": "One or more validation errors occurred.",
 *     "status": 400,
 *     "errors": { "StageName": ["The field StageName must be … '6'."] } }
 *
 * Reading only `message`/`error` left these bodies looking empty, so a 400
 * fell through to the generic "Something went wrong." and the artist was told
 * nothing — the sign-up register step does exactly this for a short stage
 * name. Web reads the same four fields in the same order (see
 * `getApiErrorMessage` in Mitro.Artist.UI/src/services/apiClient.ts).
 */
interface ApiErrorBody {
  message?: string;
  error?: string;
  detail?: string;
  title?: string;
  code?: string;
  errors?: Record<string, string[] | string>;
}

export interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError: boolean;
}

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorBody | string> =>
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
/** First message out of a ProblemDetails `errors` bag, whatever field it's on. */
const validationMessage = (errors?: ApiErrorBody['errors']): string | null => {
  if (!errors) {
    return null;
  }
  for (const value of Object.values(errors)) {
    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries) {
      if (typeof entry === 'string' && entry.trim().length > 0) {
        return entry.trim();
      }
    }
  }
  return null;
};

const text = (raw: unknown): string | null =>
  typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;

const clientMessage = (
  status: number,
  body?: ApiErrorBody | string,
): string | null => {
  if (status >= 500) {
    return null;
  }
  // Some endpoints answer 4xx with a bare string rather than JSON.
  if (typeof body === 'string') {
    return text(body);
  }
  return (
    validationMessage(body?.errors) ??
    text(body?.message) ??
    text(body?.error) ??
    text(body?.detail) ??
    text(body?.title)
  );
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
    const body = error.response.data;
    const code = typeof body === 'string' ? undefined : body?.code;

    logger.warn('API error', { status, url: error.config?.url, code });

    return {
      message: clientMessage(status, body) ?? messageForStatus(status),
      status,
      code,
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
