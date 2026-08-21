import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm, type Control, type SubmitHandler } from 'react-hook-form';

import { useAvatarPicker } from '@hooks/useAvatarPicker';
import { useProfile } from '@hooks/useProfile';
import {
  useChangeStageNameMutation,
  useUpdateProfileMutation,
} from '@hooks/useProfileMutations';
import type { ArtistProfile } from '@app-types/api';
import { getErrorMessage } from '@utils/errorHandler';
import { logger } from '@utils/logger';

import { settingsSchema, type SettingsFormValues } from './schema';

const EMPTY: SettingsFormValues = {
  stageName: '',
  bio: '',
  aboutMe: '',
  privateRate: '',
  groupRate: '',
};

const toForm = (profile: ArtistProfile): SettingsFormValues => ({
  stageName: profile.stageName,
  // The server sends null for "not set"; inputs need a string.
  bio: profile.bio ?? '',
  aboutMe: profile.aboutMe ?? '',
  privateRate: String(profile.privateShowTokenPerMinute),
  groupRate: String(profile.groupShowTokenPerMinute),
});

export interface UseSettingsResult {
  profile: ArtistProfile | undefined;
  isLoading: boolean;
  loadError: string | null;
  /** Re-runs the profile request after a failure. */
  retry: () => void;
  control: Control<SettingsFormValues>;
  /** False until the draft differs from what the server last told us. */
  isDirty: boolean;
  isValid: boolean;
  isSaving: boolean;
  saveError: string | null;
  isSaved: boolean;
  save: () => void;
  avatarUrl: string | null;
  isUploadingAvatar: boolean;
  avatarError: string | null;
  changeAvatar: () => void;
  pendingAvatarUri: string | null;
  confirmAvatar: () => void;
  cancelAvatar: () => void;
  openChangePassword: () => void;
  openChangeNumber: () => void;
}

/**
 * Settings state: reads the profile, holds a validated draft, saves it back.
 *
 * Uses react-hook-form + zod like every other form in the app, so limits are
 * enforced inline while typing instead of surfacing as a server error after
 * Save.
 *
 * The stage name goes through its own endpoint rather than the profile update,
 * so a save may be one call or two — and the rename is skipped entirely when
 * that field hasn't changed, since the server would reject renaming to the
 * name you already hold.
 */
export const useSettings = (): UseSettingsResult => {
  const router = useRouter();
  const { data: profile, isLoading, error, refetch } = useProfile();

  const { mutateAsync: updateProfile, isPending: isUpdating } =
    useUpdateProfileMutation();
  const { mutateAsync: changeStageName, isPending: isRenaming } =
    useChangeStageNameMutation();
  const avatar = useAvatarPicker();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: 'onChange',
    defaultValues: EMPTY,
  });

  // `reset` rather than `setValue`: it also moves the baseline that `isDirty`
  // compares against, so a fresh load — or a refetch after saving — leaves the
  // form clean instead of permanently dirty.
  useEffect(() => {
    if (profile) {
      reset(toForm(profile));
    }
  }, [profile, reset]);

  const onSubmit = useCallback<SubmitHandler<SettingsFormValues>>(
    async (values) => {
      if (!profile) {
        return;
      }
      setSaveError(null);

      const nextStageName = values.stageName.trim().toLowerCase();
      const renaming = nextStageName !== profile.stageName;

      try {
        await updateProfile({
          bio: values.bio.trim(),
          aboutMe: values.aboutMe.trim(),
          privateShowTokenPerMinute: Number(values.privateRate),
          groupShowTokenPerMinute: Number(values.groupRate),
        });

        if (renaming) {
          await changeStageName({ stageName: nextStageName });
        }

        logger.info('Profile saved');
        setSaved(true);
      } catch (saveFailure) {
        setSaveError(getErrorMessage(saveFailure));
      }
    },
    [changeStageName, profile, updateProfile],
  );

  return {
    profile,
    isLoading,
    loadError: error ? getErrorMessage(error) : null,
    retry: () => void refetch(),
    control,
    isDirty,
    isValid,
    isSaving: isUpdating || isRenaming,
    saveError,
    isSaved,
    save: handleSubmit(onSubmit),
    // Prefer the just-uploaded URL so the new picture shows before the
    // profile query has come back.
    avatarUrl: avatar.avatarUrl ?? profile?.avatarUrl ?? null,
    isUploadingAvatar: avatar.isUploading,
    avatarError: avatar.error,
    changeAvatar: avatar.pick,
    pendingAvatarUri: avatar.pendingUri,
    confirmAvatar: avatar.confirm,
    cancelAvatar: avatar.cancel,
    openChangePassword: () => router.push('/(app)/(modals)/change-password'),
    openChangeNumber: () => router.push('/(app)/(modals)/verify-number'),
  };
};
