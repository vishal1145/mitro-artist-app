import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { queryKeys } from '@constants/queryKeys';
import { profileApi } from '@services/api';
import type {
  ArtistPhoto,
  ChangePasswordPayload,
  ChangeStageNamePayload,
  MessageResponse,
  Result,
  SendChangePhoneOtpPayload,
  SendOtpResponse,
  UpdateProfilePayload,
  VerifyChangePhoneOtpPayload,
} from '@app-types/api';
import { AuthError } from '@utils/errorHandler';

/**
 * Authenticated artist-profile mutations.
 *
 * Anything that changes what `/profile/me` would return invalidates the
 * profile query on success, so a screen showing that data refetches itself
 * rather than every caller remembering to.
 */

const unwrap = async <T>(call: Promise<Result<T>>): Promise<T> => {
  const result = await call;
  if (!result.success) {
    throw new AuthError(result.error);
  }
  return result.data;
};

export const useUpdateProfileMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  UpdateProfilePayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'update'],
    mutationFn: (payload: UpdateProfilePayload) =>
      unwrap(profileApi.updateProfile(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
    retry: false,
  });
};

export const useChangePasswordMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  ChangePasswordPayload
> =>
  useMutation({
    mutationKey: ['profile', 'changePassword'],
    mutationFn: (payload: ChangePasswordPayload) =>
      unwrap(profileApi.changePassword(payload)),
    retry: false,
  });

export const useChangeStageNameMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  ChangeStageNamePayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'changeStageName'],
    mutationFn: (payload: ChangeStageNamePayload) =>
      unwrap(profileApi.changeStageName(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
    retry: false,
  });
};

/* --------------------------- Change number ----------------------------- */

export const useSendChangePhoneOtpMutation = (): UseMutationResult<
  SendOtpResponse,
  Error,
  SendChangePhoneOtpPayload
> =>
  useMutation({
    mutationKey: ['profile', 'sendChangePhoneOtp'],
    mutationFn: (payload: SendChangePhoneOtpPayload) =>
      unwrap(profileApi.sendChangePhoneOtp(payload)),
    retry: false,
  });

export const useVerifyChangePhoneOtpMutation = (): UseMutationResult<
  MessageResponse,
  Error,
  VerifyChangePhoneOtpPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'verifyChangePhoneOtp'],
    mutationFn: (payload: VerifyChangePhoneOtpPayload) =>
      unwrap(profileApi.verifyChangePhoneOtp(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
    retry: false,
  });
};

/* ------------------------------- Media --------------------------------- */

/** Presign, upload, confirm. Resolves to the public URL of the new avatar. */
export const useUploadAvatarMutation = (): UseMutationResult<
  string,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'uploadAvatar'],
    mutationFn: (fileUri: string) => unwrap(profileApi.uploadAvatar(fileUri)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me() });
    },
    retry: false,
  });
};

/** Presign, upload, attach. Resolves to the photo's public URL. */
export const useUploadPhotoMutation = (): UseMutationResult<
  string,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'uploadPhoto'],
    mutationFn: (fileUri: string) => unwrap(profileApi.uploadPhoto(fileUri)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.photos() });
    },
    retry: false,
  });
};

/**
 * Remove a gallery photo.
 *
 * Optimistic: the tile disappears on tap rather than after a round trip,
 * because the artist has already decided and a spinner on a delete reads as a
 * failure. The previous list is restored if the server refuses.
 */
export const useDeletePhotoMutation = (): UseMutationResult<
  null,
  Error,
  string,
  { previous: ArtistPhoto[] | undefined }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile', 'deletePhoto'],
    mutationFn: (photoId: string) => unwrap(profileApi.deletePhoto(photoId)),

    onMutate: async (photoId) => {
      // Stop any in-flight refetch from overwriting the optimistic list.
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.photos() });

      const previous = queryClient.getQueryData<ArtistPhoto[]>(
        queryKeys.profile.photos(),
      );

      queryClient.setQueryData<ArtistPhoto[]>(
        queryKeys.profile.photos(),
        (current) => current?.filter((photo) => photo.id !== photoId) ?? [],
      );

      return { previous };
    },

    onError: (_error, _photoId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.photos(), context.previous);
      }
    },

    // Settled, not success: reconcile with the server either way.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.photos() });
    },

    retry: false,
  });
};
