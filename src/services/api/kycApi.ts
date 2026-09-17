import type {
  BankAccount,
  KycStatus,
  KycUploadUrlPayload,
  KycUploadUrlResponse,
  KycViewUrlResponse,
  MessageResponse,
  Result,
  SaveAadhaarPayload,
  SaveBankAccountPayload,
  SavePanPayload,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';

import { api } from './client';
import { ENDPOINTS } from './endpoints';
import { contentTypeFor, fileNameFor, putFileToSignedUrl } from './uploadFile';

/**
 * KYC + payout bank account — full read/write, mirroring the web's
 * `kycService`. Same `Result<T>` contract as the other services: nothing here
 * throws.
 */
export const kycApi = {
  /** Current verification state for the signed-in artist. */
  async getStatus(): Promise<Result<KycStatus>> {
    try {
      const res = await api.get<KycStatus>(ENDPOINTS.kyc.status);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * The linked payout account, or `null` when none is on file. A 404 here means
   * "no account yet", which is a normal empty state — not an error — so it
   * resolves successfully with `null` rather than failing the screen.
   */
  async getBankAccount(): Promise<Result<BankAccount | null>> {
    try {
      const res = await api.get<BankAccount>(ENDPOINTS.kyc.bankAccount);
      return { success: true, data: res.data ?? null };
    } catch {
      return { success: true, data: null };
    }
  },

  /**
   * Upload a KYC document, all three steps — presign, PUT the bytes straight to
   * storage, and resolve to the document key the pan/aadhaar save calls expect.
   * Mirrors the web's `handleFileUpload`: it prefers `objectKey`, then
   * `publicUrl`, then the path portion of the signed URL.
   */
  async uploadDocument(
    fileUri: string,
    documentType: string,
  ): Promise<Result<string>> {
    try {
      const fileName = fileNameFor(fileUri);
      const contentType = contentTypeFor(fileName);

      const presign = await api.post<KycUploadUrlResponse>(
        ENDPOINTS.kyc.documentsUploadUrl,
        { documentType, fileName, contentType } satisfies KycUploadUrlPayload,
      );

      await putFileToSignedUrl(presign.data.uploadUrl, fileUri, contentType);

      const key =
        presign.data.objectKey ||
        presign.data.publicUrl ||
        presign.data.uploadUrl.split('?')[0] ||
        '';
      return { success: true, data: key };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** A short-lived URL to view an already-uploaded document. */
  async getViewUrl(documentType: string): Promise<Result<string>> {
    try {
      const res = await api.get<KycViewUrlResponse>(
        ENDPOINTS.kyc.documentViewUrl(documentType),
      );
      const url = res.data?.viewUrl || res.data?.url || '';
      return { success: true, data: url };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async savePan(payload: SavePanPayload): Promise<Result<MessageResponse>> {
    try {
      const res = await api.put<MessageResponse>(ENDPOINTS.kyc.pan, payload);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async saveAadhaar(
    payload: SaveAadhaarPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.put<MessageResponse>(ENDPOINTS.kyc.aadhaar, payload);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async saveBankAccount(
    payload: SaveBankAccountPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.put<MessageResponse>(
        ENDPOINTS.kyc.bankAccount,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async submitKyc(): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(ENDPOINTS.kyc.submit);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
