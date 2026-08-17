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
      message: messageForStatus(status),
      status,
      code: error.response.data?.code,
      isNetworkError: false,
    };
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
