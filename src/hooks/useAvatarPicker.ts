import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { useUploadAvatarMutation } from './useProfileMutations';

const PERMISSION_DENIED =
  'Photo access is off. Turn it on in Settings to change your picture.';

export interface AvatarPickerResult {
  /** Opens the photo library. Picking shows a preview rather than uploading. */
  pick: () => void;
  /** Local URI awaiting confirmation, or null when nothing is pending. */
  pendingUri: string | null;
  /** Uploads the pending picture. */
  confirm: () => void;
  /** Discards the pending picture without uploading. */
  cancel: () => void;
  isUploading: boolean;
  /** Public URL of the picture just uploaded, for an instant swap. */
  avatarUrl: string | null;
  error: string | null;
}

/**
 * Tap-to-change avatar: permission, picker, preview, three-step upload.
 *
 * `allowsEditing` is deliberately off. It hands over to the OS crop screen,
 * whose only action is labelled "CROP" — wording we can't change and that
 * doesn't read as "save". The app shows its own preview and its own
 * "Upload Photo" button instead. Nothing is lost by skipping the crop: the
 * avatar renders with `contentFit="cover"` in a circle either way.
 */
export const useAvatarPicker = (): AvatarPickerResult => {
  const { mutateAsync: upload, isPending } = useUploadAvatarMutation();
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = useCallback(async () => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(PERMISSION_DENIED);
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Enough for a large avatar without pushing a multi-megabyte upload
      // through a phone connection.
      quality: 0.8,
    });

    // Cancelling isn't an error — leave the current avatar alone.
    if (picked.canceled || !picked.assets[0]) {
      return;
    }

    setPendingUri(picked.assets[0].uri);
  }, []);

  const confirm = useCallback(async () => {
    if (!pendingUri) {
      return;
    }
    setError(null);

    try {
      const url = await upload(pendingUri);
      setAvatarUrl(url);
      setPendingUri(null);
      logger.info('Avatar updated');
    } catch (uploadError) {
      // Keep the preview open so the artist can retry without re-picking.
      setError(getErrorMessage(uploadError));
    }
  }, [pendingUri, upload]);

  return {
    pick: () => void pick(),
    pendingUri,
    confirm: () => void confirm(),
    cancel: () => {
      setPendingUri(null);
      setError(null);
    },
    isUploading: isPending,
    avatarUrl,
    error,
  };
};
