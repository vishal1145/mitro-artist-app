import axios, { type AxiosInstance } from 'axios';

import { API_CONFIG, REGEX } from '@constants/app';

/**
 * Axios instance. HTTPS is enforced at the request layer (see interceptors):
 * any non-https URL is rejected before it leaves the device.
 */

// Fail fast in development if someone points the app at a plaintext endpoint.
if (!REGEX.httpsOnly.test(API_CONFIG.baseUrl)) {
  throw new Error(
    `Insecure API base URL rejected: "${API_CONFIG.baseUrl}". HTTPS is required.`,
  );
}

export const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeoutMs,
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
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
