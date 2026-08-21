import type {
  ArtistAuthResponse,
  AuthSession,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  Result,
  SendOtpPayload,
  SendOtpResponse,
  StageNameCheckResponse,
  VerifyOtpPayload,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Auth service. Every call is wrapped in a typed try/catch and returns the
 * Result<T> union — callers never deal with raw thrown errors.
 */
/**
 * Map the server's `{ accessToken, artist }` onto the app's session shape.
 * The artist endpoints return the body bare — there is no `data` envelope,
 * and no refresh token is issued in the body (it arrives as a cookie).
 */
const toSession = (res: ArtistAuthResponse): AuthSession => ({
  user: {
    id: res.artist.id,
    name: res.artist.stageName,
    username: res.artist.stageName,
    approvalStatus: res.artist.approvalStatus,
  },
  tokens: { accessToken: res.accessToken },
});

export const authApi = {
  async login(payload: LoginPayload): Promise<Result<AuthSession>> {
    try {
      const res = await api.post<ArtistAuthResponse>(ENDPOINTS.auth.login, payload);
      return { success: true, data: toSession(res.data) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /* ---------------------------- Sign-up ---------------------------------- */

  /** Sign-up step 1: text a code to the number about to be registered. */
  async sendRegistrationOtp(
    payload: SendOtpPayload,
  ): Promise<Result<SendOtpResponse>> {
    try {
      const res = await api.post<SendOtpResponse>(
        ENDPOINTS.auth.sendRegistrationOtp,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Sign-up step 2: confirm the code. No token comes back here — the phone is
   * simply marked verified server-side, and `register` must follow promptly.
   */
  async verifyRegistrationOtp(
    payload: VerifyOtpPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(
        ENDPOINTS.auth.verifyRegistrationOtp,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Sign-up step 3: creates the artist and returns a session.
   * Requires a verified phone — otherwise the server answers 400
   * "Phone verification expired. Please request OTP again."
   */
  async register(payload: RegisterPayload): Promise<Result<AuthSession>> {
    try {
      const res = await api.post<ArtistAuthResponse>(ENDPOINTS.auth.register, payload);
      return { success: true, data: toSession(res.data) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Is this stage name free? Drives the inline hint on the sign-up form. */
  async checkStageName(name: string): Promise<Result<StageNameCheckResponse>> {
    try {
      const res = await api.get<StageNameCheckResponse>(
        ENDPOINTS.auth.stageNameCheck,
        { params: { name } },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /* ------------------------- Password reset ------------------------------ */

  /** Reset step 1. Same shape as the sign-up send — phone only. */
  async sendPasswordResetOtp(
    payload: SendOtpPayload,
  ): Promise<Result<SendOtpResponse>> {
    try {
      const res = await api.post<SendOtpResponse>(
        ENDPOINTS.auth.sendPasswordResetOtp,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Reset step 2. Returns a message only — the new password comes next. */
  async verifyPasswordResetOtp(
    payload: VerifyOtpPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(
        ENDPOINTS.auth.verifyPasswordResetOtp,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Reset step 3. No session comes back, so the artist is sent to the login
   * screen to sign in with the password they just chose.
   */
  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(
        ENDPOINTS.auth.resetPassword,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /* ------------------------------ Session -------------------------------- */

  async logout(): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.auth.logout);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
