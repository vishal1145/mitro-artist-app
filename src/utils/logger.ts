/* eslint-disable no-console */
/**
 * The ONLY sanctioned logging site in the app.
 * Everywhere else must call logger.* — never console.* directly.
 *
 * - In development: writes to the console.
 * - In production: console output is suppressed; hook `report()` into your
 *   crash/analytics pipeline (Sentry, etc.) at the marked TODO-free seam.
 * - Sensitive keys (tokens, passwords, PII) are redacted before output.
 */
import Constants from 'expo-constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = [
  'password',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'otp',
  'pin',
  'secret',
  'ssn',
  'cardnumber',
  'cvv',
];

const isDev = (): boolean =>
  Constants.expoConfig?.extra?.apiBaseUrl !== undefined && __DEV__;

const isSensitiveKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
};

/** Deep-clone meta while masking any sensitive fields. */
const redact = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value as object)) {
    return '[Circular]';
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  const result: LogMeta = {};
  for (const [key, val] of Object.entries(value as LogMeta)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redact(val, seen);
  }
  return result;
};

const write = (level: LogLevel, message: string, meta?: LogMeta): void => {
  const safeMeta = meta ? (redact(meta) as LogMeta) : undefined;

  if (__DEV__) {
    const tag = `[${level.toUpperCase()}]`;
    const args: unknown[] = [tag, message];
    if (safeMeta) {
      args.push(safeMeta);
    }
    switch (level) {
      case 'error':
        console.error(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      default:
        console.log(...args);
    }
    return;
  }

  // Production: forward warn/error to your monitoring provider here.
  if (level === 'error' || level === 'warn') {
    report(level, message, safeMeta);
  }
};

/** Seam for a production crash/analytics reporter. No-op until wired up. */
const report = (
  _level: LogLevel,
  _message: string,
  _meta?: LogMeta,
): void => {
  // Intentionally empty: integrate Sentry/Crashlytics here without changing
  // call sites across the app.
};

export const logger = {
  debug: (message: string, meta?: LogMeta): void => {
    if (isDev()) {
      write('debug', message, meta);
    }
  },
  info: (message: string, meta?: LogMeta): void => write('info', message, meta),
  warn: (message: string, meta?: LogMeta): void => write('warn', message, meta),
  error: (message: string, meta?: LogMeta): void =>
    write('error', message, meta),
};

export type Logger = typeof logger;
