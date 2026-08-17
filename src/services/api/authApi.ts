import type {
  ApiResponse,
  AuthSession,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  Result,
  VerifyOtpPayload,
} from '@types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

/**
 * Auth service. Every call is wrapped in a typed try/catch and returns the
 * Result<T> union — callers never deal with raw thrown errors.
 */
export const authApi = {
  async login(payload: LoginPayload): Promise<Result<AuthSession>> {
    try {
      const res = await api.post<ApiResponse<AuthSession>>(
        ENDPOINTS.auth.login,
        payload,
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async register(payload: RegisterPayload): Promise<Result<AuthSession>> {
    try {
      const res = await api.post<ApiResponse<AuthSession>>(
        ENDPOINTS.auth.register,
        payload,
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<Result<{ sent: boolean }>> {
    try {
      await api.post(ENDPOINTS.auth.forgotPassword, payload);
      return { success: true, data: { sent: true } };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<Result<AuthSession>> {
    try {
      const res = await api.post<ApiResponse<AuthSession>>(
        ENDPOINTS.auth.verifyOtp,
        payload,
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async resendOtp(payload: ForgotPasswordPayload): Promise<Result<{ sent: boolean }>> {
    try {
      await api.post(ENDPOINTS.auth.resendOtp, payload);
      return { success: true, data: { sent: true } };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async logout(): Promise<Result<null>> {
    try {
      await api.post(ENDPOINTS.auth.logout);
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
