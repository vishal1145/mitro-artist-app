/**
 * API response & domain types. No `any` anywhere in the app — model the
 * server contract explicitly here and import from @types.
 */

/** Result<T> pattern — every service call returns this discriminated union. */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Standard envelope our API wraps successful payloads in. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/** Authenticated user. */
export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

// --- Request payloads ---

export interface LoginPayload {
  /** Email or username. */
  identifier: string;
  password: string;
}

export type SocialProviderId = 'google' | 'apple';

export interface RegisterPayload {
  name: string;
  /** Stage name / handle. */
  username: string;
  /** 10-digit national mobile number. */
  mobile: string;
  password: string;
}

export interface ForgotPasswordPayload {
  mobile: string;
}

export interface VerifyOtpPayload {
  mobile: string;
  code: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}
