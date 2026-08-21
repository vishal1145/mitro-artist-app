import axios, { type AxiosInstance } from 'axios';

import { API_CONFIG, REGEX } from '@constants/app';
import { logger } from '@utils/logger';

/**
 * Axios instance. HTTPS is enforced at the request layer (see interceptors):
 * any non-https URL is rejected before it leaves the device.
 */

/**
 * HTTPS is mandatory in release builds. Dev builds may point at a plaintext
 * LAN address (e.g. http://192.168.x.x:8081) so the app can talk to a local
 * API server — but it warns loudly, and a release build still refuses to boot
 * against a plaintext endpoint.
 */
if (!REGEX.httpsOnly.test(API_CONFIG.baseUrl)) {
  if (__DEV__) {
    logger.warn('API base URL is not HTTPS — allowed in dev only', {
      baseUrl: API_CONFIG.baseUrl,
    });
  } else {
    throw new Error(
      `Insecure API base URL rejected: "${API_CONFIG.baseUrl}". HTTPS is required.`,
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
