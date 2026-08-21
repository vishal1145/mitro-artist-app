import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AvatarPreview,
  ConfirmDialog,
  EmptyState,
  LoadFailed,
  PageHeader,
  PhotoViewer,
  Screen,
  Skeleton,
} from '@components/shared';
import { Text } from '@components/ui';
import { usePhotoGallery } from '@screens/profile/photos/usePhotoGallery';
import { colors, fontFamily, layout, radius } from '@theme';
import { rf, SCREEN } from '@utils/responsive';

const COLUMNS = 3;
const GAP = 10;
/** Square tile that fits three across inside the screen padding. */
const TILE =
  (SCREEN.width - layout.screenPadding * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

/** Photo gallery — UI only. Logic in usePhotoGallery(). */
const PhotosScreen = () => {
  const router = useRouter();
  const {
    photos,
    isLoading,
    loadError,
    retry,
    isRetrying,
    addPhoto,
    pendingUri,
    confirmUpload,
    cancelUpload,
    isUploading,
    viewing,
    openViewer,
    closeViewer,
    photoToDelete,
    askDelete,
    confirmDelete,
    cancelDelete,
    error,
  } = usePhotoGallery();

  return (
    <Screen
      tabBarSpacing
      scrollable
      padded={false}
      contentContainerStyle={styles.content}
      header={<PageHeader title="Photos" onBack={() => router.back()} />}
    >
      {error ? (
        <Text variant="bodySm" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={TILE} height={TILE} round={radius.card} />
          ))}
        </View>
      ) : loadError ? (
        <LoadFailed message={loadError} onRetry={retry} isRetrying={isRetrying} />
      ) : photos.length === 0 ? (
        <EmptyState
          icon="image"
          title="No photos yet"
          description="Add a few so fans know who they're joining."
          actionLabel="Add photo"
          onAction={addPhoto}
        />
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              style={styles.tile}
              onPress={() => openViewer(photo)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Open photo"
            >
              <Image
                source={{ uri: photo.photoUrl }}
                style={styles.image}
                contentFit="cover"
                transition={150}
                // Caching is off here on purpose. expo-image caches by URL, so
                // if the server ever reuses a storage key the old bytes keep
                // being served and a freshly uploaded photo shows the previous
                // one. Costs a re-fetch per view; worth it until the API
                // guarantees a unique URL per photo, at which point this can
                // go back to the default.
                cachePolicy="none"
                accessibilityLabel="Gallery photo"
              />
              <Pressable
                onPress={() => askDelete(photo)}
                hitSlop={8}
                style={styles.remove}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Feather name="x" size={rf(13)} color={colors.white} />
              </Pressable>
            </Pressable>
          ))}

          {/* Add tile sits in the grid so it's always the next slot. */}
          <Pressable
            onPress={addPhoto}
            style={[styles.tile, styles.addTile]}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <Feather name="plus" size={rf(22)} color={colors.textMuted} />
            <Text variant="bodySm" color="textMuted" style={styles.addLabel}>
              Add
            </Text>
          </Pressable>
        </View>
      )}

      {/* Same confirm step as the avatar — see AvatarPreview. */}
      <AvatarPreview
        visible={Boolean(pendingUri)}
        uri={pendingUri}
        isUploading={isUploading}
        error={error}
        onConfirm={confirmUpload}
        onChooseAnother={addPhoto}
        onCancel={cancelUpload}
      />

      <PhotoViewer
        visible={Boolean(viewing)}
        uri={viewing?.photoUrl ?? null}
        onClose={closeViewer}
        onDelete={() => viewing && askDelete(viewing)}
      />

      <ConfirmDialog
        visible={Boolean(photoToDelete)}
        icon="trash-2"
        title="Remove photo?"
        message="It'll be deleted from your profile straight away."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  error: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginTop: 8,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayDim,
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.transparent,
  },
  addLabel: {
    fontFamily: fontFamily.bold,
    marginTop: 4,
  },
});

export default PhotosScreen;
