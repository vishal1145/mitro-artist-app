import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { usePhotos } from '@hooks/useProfile';
import {
  useDeletePhotoMutation,
  useUploadPhotoMutation,
} from '@hooks/useProfileMutations';
import type { ArtistPhoto } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

const PERMISSION_DENIED =
  'Photo access is off. Turn it on in Settings to add photos.';

export interface UsePhotoGalleryResult {
  photos: ArtistPhoto[];
  isLoading: boolean;
  loadError: string | null;
  /** Re-runs the gallery request after a failure. */
  retry: () => void;
  isRetrying: boolean;
  /** Opens the library; the pick lands in `pendingUri` for confirmation. */
  addPhoto: () => void;
  pendingUri: string | null;
  confirmUpload: () => void;
  cancelUpload: () => void;
  isUploading: boolean;
  /** Photo open in the full-screen viewer, or null. */
  viewing: ArtistPhoto | null;
  openViewer: (photo: ArtistPhoto) => void;
  closeViewer: () => void;
  /** Photo queued for deletion, awaiting the confirm dialog. */
  photoToDelete: ArtistPhoto | null;
  askDelete: (photo: ArtistPhoto) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  error: string | null;
}

/**
 * Photo gallery: list, add, remove.
 *
 * Both destructive and additive actions go through a confirm step — uploads so
 * the artist sees what they picked before it goes public, deletes because
 * there's no undo once the file is gone from storage.
 */
export const usePhotoGallery = (): UsePhotoGalleryResult => {
  const {
    data: photos,
    isLoading,
    error: loadError,
    refetch,
    isRefetching,
  } = usePhotos();
  const { mutateAsync: upload, isPending: isUploading } = useUploadPhotoMutation();
  const { mutateAsync: remove } = useDeletePhotoMutation();

  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ArtistPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<ArtistPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPhoto = useCallback(async () => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(PERMISSION_DENIED);
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (picked.canceled || !picked.assets[0]) {
      return;
    }

    setPendingUri(picked.assets[0].uri);
  }, []);

  const confirmUpload = useCallback(async () => {
    if (!pendingUri) {
      return;
    }
    setError(null);

    try {
      await upload(pendingUri);
      setPendingUri(null);
      logger.info('Gallery photo added');
    } catch (uploadError) {
      // Preview stays open so a retry doesn't mean re-picking.
      setError(getErrorMessage(uploadError));
    }
  }, [pendingUri, upload]);

  const confirmDelete = useCallback(async () => {
    if (!photoToDelete) {
      return;
    }
    const target = photoToDelete;
    // Close both first — the tile is already gone optimistically, and the
    // viewer would otherwise be left showing a photo that no longer exists.
    setPhotoToDelete(null);
    setViewing(null);

    try {
      await remove(target.id);
      logger.info('Gallery photo removed');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }, [photoToDelete, remove]);

  return {
    photos: photos ?? [],
    isLoading,
    loadError: loadError ? getErrorMessage(loadError) : null,
    retry: () => void refetch(),
    isRetrying: isRefetching,
    addPhoto: () => void addPhoto(),
    pendingUri,
    confirmUpload: () => void confirmUpload(),
    cancelUpload: () => {
      setPendingUri(null);
      setError(null);
    },
    isUploading,
    viewing,
    openViewer: setViewing,
    closeViewer: () => setViewing(null),
    photoToDelete,
    askDelete: setPhotoToDelete,
    confirmDelete: () => void confirmDelete(),
    cancelDelete: () => setPhotoToDelete(null),
    error,
  };
};
