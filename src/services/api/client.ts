import axios, { type AxiosInstance } from 'axios';

import { API_CONFIG, REGEX } from '@constants/app';
import { logger } from '@utils/logger';

/**
 * Axios instance. HTTPS is enforced at the request layer (see interceptors):
 * any non-https URL is rejected before it leaves the device.
 */

/**
 * HTTPS is mandatory in release builds; dev builds may point at a plaintext
 * LAN address (e.g. http://192.168.x.x:8081) to reach a local API server.
 *
 * This only reports the problem — it must never throw. This module is imported
 * during startup, so throwing here kills the process before React mounts and
 * the app closes the instant it's opened, with no screen and no message. A
 * release APK built against a plaintext URL did exactly that.
 *
 * Enforcement lives in the request interceptor instead, which rejects any
 * non-HTTPS request outside dev. Same guarantee, but the app stays up and the
 * failure is visible where it can be read.
 */
if (!REGEX.httpsOnly.test(API_CONFIG.baseUrl)) {
  if (__DEV__) {
    logger.warn('API base URL is not HTTPS — allowed in dev only', {
      baseUrl: API_CONFIG.baseUrl,
    });
  } else {
    logger.error(
      'API base URL is not HTTPS — every request will be blocked in this build',
      { baseUrl: API_CONFIG.baseUrl },
    );
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeoutMs,
  // The refresh credential lives in an httpOnly cookie, not the response body,
  // so both instances have to send and accept cookies.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * A bare instance with no interceptors — used exclusively for the token
 * refresh call, to avoid recursive 401 handling.
 */
export const refreshClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeoutMs,
  // The refresh credential lives in an httpOnly cookie, not the response body,
  // so both instances have to send and accept cookies.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
