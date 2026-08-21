import type {
  ArtistCategory,
  ArtistPhoto,
  ArtistProfile,
  ChangePasswordPayload,
  ChangeStageNamePayload,
  MessageResponse,
  Result,
  SendChangePhoneOtpPayload,
  SendOtpResponse,
  SetAvatarPayload,
  UpdateProfilePayload,
  SavePhotoPayload,
  UploadUrlPayload,
  UploadUrlResponse,
  VerifyChangePhoneOtpPayload,
} from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { api } from './client';
import { ENDPOINTS } from './endpoints';
import { contentTypeFor, fileNameFor, putFileToSignedUrl } from './uploadFile';

/**
 * Authenticated artist-profile service. Same `Result<T>` contract as authApi —
 * no call in here throws.
 */
export const profileApi = {
  async getProfile(): Promise<Result<ArtistProfile>> {
    try {
      const res = await api.get<ArtistProfile>(ENDPOINTS.profile.me);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** Returns a bare array — there's no `data` envelope on this route. */
  async getCategories(): Promise<Result<ArtistCategory[]>> {
    try {
      const res = await api.get<ArtistCategory[]>(ENDPOINTS.profile.categories);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.put<MessageResponse>(
        ENDPOINTS.profile.update,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(
        ENDPOINTS.profile.changePassword,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async changeStageName(
    payload: ChangeStageNamePayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(
        ENDPOINTS.profile.changeStageName,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /* --------------------------- Change number ---------------------------- */

  async sendChangePhoneOtp(
    payload: SendChangePhoneOtpPayload,
  ): Promise<Result<SendOtpResponse>> {
    try {
      const res = await api.post<SendOtpResponse>(
        ENDPOINTS.profile.sendChangePhoneOtp,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async verifyChangePhoneOtp(
    payload: VerifyChangePhoneOtpPayload,
  ): Promise<Result<MessageResponse>> {
    try {
      const res = await api.post<MessageResponse>(
        ENDPOINTS.profile.verifyChangePhoneOtp,
        payload,
      );
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /* ------------------------------ Media --------------------------------- */

  /**
   * Avatar upload, all three steps.
   *
   * Presign, PUT the bytes straight to storage, then tell the API where they
   * landed. Kept as one service call because a half-finished upload is not a
   * useful state for a screen to hold — either the avatar is set or it isn't.
   *
   * Returns the public URL so the caller can show it immediately rather than
   * waiting on a profile refetch.
   */
  async uploadAvatar(fileUri: string): Promise<Result<string>> {
    try {
      const fileName = fileNameFor(fileUri);
      const contentType = contentTypeFor(fileName);

      const presign = await api.post<UploadUrlResponse>(
        ENDPOINTS.profile.avatarUploadUrl,
        { fileName, contentType } satisfies UploadUrlPayload,
      );

      await putFileToSignedUrl(presign.data.uploadUrl, fileUri, contentType);

      await api.post<MessageResponse>(ENDPOINTS.profile.avatar, {
        avatarUrl: presign.data.publicUrl,
      } satisfies SetAvatarPayload);

      return { success: true, data: presign.data.publicUrl };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /** The artist's photo gallery. Bare array, like categories. */
  async getPhotos(): Promise<Result<ArtistPhoto[]>> {
    try {
      const res = await api.get<ArtistPhoto[]>(ENDPOINTS.profile.photos);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Gallery photo upload, all three steps — presign, PUT, attach.
   *
   * Mirrors uploadAvatar: a photo that reached storage but was never attached
   * is invisible to the artist and impossible to delete, so the three calls
   * belong together rather than split across the caller.
   */
  async uploadPhoto(fileUri: string): Promise<Result<string>> {
    try {
      const fileName = fileNameFor(fileUri);
      const contentType = contentTypeFor(fileName);

      const presign = await api.post<UploadUrlResponse>(
        ENDPOINTS.profile.photoUploadUrl,
        { fileName, contentType } satisfies UploadUrlPayload,
      );

      // If two different photos come back with the same publicUrl, the server
      // is building its storage key from the artist id rather than per photo,
      // so every upload overwrites the last one. That shows up here before it
      // ever reaches the gallery.
      logger.info('Photo presigned', {
        pickedFrom: fileUri,
        publicUrl: presign.data.publicUrl,
      });

      await putFileToSignedUrl(presign.data.uploadUrl, fileUri, contentType);

      await api.post<MessageResponse>(ENDPOINTS.profile.photos, {
        photoUrl: presign.data.publicUrl,
      } satisfies SavePhotoPayload);

      return { success: true, data: presign.data.publicUrl };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },

  async deletePhoto(photoId: string): Promise<Result<null>> {
    try {
      await api.delete(ENDPOINTS.profile.photo(photoId));
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
