import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useAvatarPicker } from '@hooks/useAvatarPicker';
import { useCategories, usePhotos, useProfile, useSubcategories } from '@hooks/useProfile';
import {
  useChangeStageNameMutation,
  useDeletePhotoMutation,
  useUpdateCategoryMutation,
  useUpdateProfileMutation,
  useUploadPhotoMutation,
} from '@hooks/useProfileMutations';
import { getErrorMessage } from '@utils/errorHandler';
import { showPopupToast } from '@utils/toast';

import {
  GALLERY_COLS,
  GALLERY_GAP,
  basicInfoDone as computeBasicInfoDone,
  computeCompletenessPct,
  computeStrengthHeadline,
  galleryDone as computeGalleryDone,
  pricingDone as computePricingDone,
  skillsDone as computeSkillsDone,
} from './schema';
import type { UseEditProfileResult } from './types';

/** All edit-profile screen logic (minus the mobile-number and change-password
 *  sections, which own their own hooks). The screen component renders state;
 *  it holds none. */
export const useEditProfile = (): UseEditProfileResult => {
  const profileQuery = useProfile();
  const categoriesQuery = useCategories();
  const photosQuery = usePhotos();

  const profile = profileQuery.data;
  const categories = categoriesQuery.data ?? [];
  const photos = photosQuery.data ?? [];

  const [stageName, setStageName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [workTime, setWorkTime] = useState('');
  const [bio, setBio] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [languages, setLanguages] = useState('');
  const [skills, setSkills] = useState('');
  const [privateShowTokenPerMinute, setPrivateShowTokenPerMinute] = useState('');
  const [groupShowTokenPerMinute, setGroupShowTokenPerMinute] = useState('');

  /**
   * Gallery tiles are sized from the measured grid width rather than left to
   * `width: '31%' + aspectRatio: 1`.
   *
   * That combination looked right for a full row of three but not for a
   * part-filled last row: the lone "Add Photo" tile came out squat, and the
   * rows themselves ended up a few pixels apart in height. Measuring once and
   * handing every tile the SAME exact pixel box makes all of them square, on
   * every row, whatever the photo count.
   */
  const [galleryWidth, setGalleryWidth] = useState(0);
  const tile =
    galleryWidth > 0
      ? Math.floor((galleryWidth - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS)
      : 0;
  const tileSize = tile > 0 ? { width: tile, height: tile } : null;

  const avatar = useAvatarPicker();
  const avatarUrl = avatar.avatarUrl ?? profile?.avatarUrl ?? null;

  const updateProfile = useUpdateProfileMutation();
  const updateCategory = useUpdateCategoryMutation();
  const changeStageName = useChangeStageNameMutation();
  const uploadPhoto = useUploadPhotoMutation();
  const deletePhoto = useDeletePhotoMutation();

  useEffect(() => {
    if (!profile) return;
    setStageName(profile.stageName ?? '');
    setWorkTime(profile.workTime ?? '');
    setBio(profile.bio ?? '');
    setAboutMe(profile.aboutMe ?? '');
    setLanguages(profile.languages ? profile.languages.join(', ') : '');
    setSkills(profile.skills ? profile.skills.join(', ') : '');
    setPrivateShowTokenPerMinute(profile.privateShowTokenPerMinute?.toString() ?? '');
    setGroupShowTokenPerMinute(profile.groupShowTokenPerMinute?.toString() ?? '');
    setCategoryId(profile.categoryId ?? '');
    setSubcategoryId(profile.subcategoryId ?? '');
  }, [profile]);

  const { data: subcategories, isLoading: loadingSubcategories } =
    useSubcategories(categoryId);

  /**
   * Changing the primary category invalidates whatever sub was picked under
   * the old one, so drop it rather than saving an id that belongs to a
   * different parent.
   */
  const handleSelectCategory = (id: string) => {
    if (id !== categoryId) {
      setSubcategoryId('');
    }
    setCategoryId(id);
  };

  const isSaving =
    changeStageName.isPending || updateCategory.isPending || updateProfile.isPending;

  const handleSave = async () => {
    try {
      if (profile && stageName !== profile.stageName) {
        await changeStageName.mutateAsync({ stageName });
      }
      if (categoryId) {
        // `subcategoryId` — lowercase 'c' — is what UpdateArtistCategoryRequest
        // declares; null clears it.
        await updateCategory.mutateAsync({
          categoryId,
          subcategoryId: subcategoryId || null,
        });
      }
      await updateProfile.mutateAsync({
        bio,
        workTime,
        aboutMe,
        languages: languages.split(',').map((l) => l.trim()).filter((l) => l),
        skills: skills.split(',').map((s) => s.trim()).filter((s) => s),
        privateShowTokenPerMinute: privateShowTokenPerMinute
          ? parseInt(privateShowTokenPerMinute, 10)
          : 0,
        groupShowTokenPerMinute: groupShowTokenPerMinute
          ? parseInt(groupShowTokenPerMinute, 10)
          : 0,
      });
      showPopupToast('Profile saved successfully.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const handleAddPhoto = async () => {
    if (uploadPhoto.isPending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPopupToast('Photo access is off. Turn it on in Settings to add photos.', 'error');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    try {
      await uploadPhoto.mutateAsync(picked.assets[0].uri);
      showPopupToast('Photo added to gallery.', 'success');
    } catch (e) {
      showPopupToast(getErrorMessage(e), 'error');
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete photo?',
      "Are you sure you want to delete this photo? This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto.mutateAsync(photoId);
              showPopupToast('Photo deleted.', 'success');
            } catch (e) {
              showPopupToast(getErrorMessage(e), 'error');
            }
          },
        },
      ],
    );
  };

  const skillList = useMemo(
    () => skills.split(',').map((s) => s.trim()).filter(Boolean),
    [skills],
  );

  const basicInfoDone = computeBasicInfoDone(stageName);
  const pricingDone = computePricingDone(privateShowTokenPerMinute, groupShowTokenPerMinute);
  const skillsDone = computeSkillsDone(skillList);
  const galleryDone = computeGalleryDone(photos.length);
  const completenessPct = computeCompletenessPct(
    basicInfoDone,
    pricingDone,
    skillsDone,
    galleryDone,
  );

  const strengthHeadline = computeStrengthHeadline(completenessPct, skillsDone, galleryDone);

  const isLoading = profileQuery.isLoading;
  const loadError = profileQuery.isError;

  return {
    profile,
    categories,
    photos,
    isLoading,
    loadError,
    refetchProfile: () => void profileQuery.refetch(),

    stageName,
    setStageName,
    categoryId,
    subcategoryId,
    setSubcategoryId,
    workTime,
    setWorkTime,
    bio,
    setBio,
    aboutMe,
    setAboutMe,
    languages,
    setLanguages,
    skills,
    setSkills,
    privateShowTokenPerMinute,
    setPrivateShowTokenPerMinute,
    groupShowTokenPerMinute,
    setGroupShowTokenPerMinute,

    subcategories: subcategories ?? [],
    loadingSubcategories,
    handleSelectCategory,

    isSaving,
    handleSave: () => void handleSave(),

    avatar,
    avatarUrl,

    handleAddPhoto: () => void handleAddPhoto(),
    isUploadingPhoto: uploadPhoto.isPending,
    handleDeletePhoto,

    skillList,

    galleryWidth,
    setGalleryWidth,
    tileSize,

    basicInfoDone,
    pricingDone,
    skillsDone,
    galleryDone,
    completenessPct,
    strengthHeadline,
  };
};
