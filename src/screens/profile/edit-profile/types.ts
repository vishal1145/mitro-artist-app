import type { Dispatch, SetStateAction } from 'react';

import type { AvatarPickerResult } from '@hooks/useAvatarPicker';
import type {
  ArtistCategory,
  ArtistPhoto,
  ArtistProfile,
  ArtistSubcategory,
} from '@app-types/api';

/** The screen's editable draft fields — mirrors the `useState` calls that used
 *  to live directly in the screen component. */
export interface EditProfileFormState {
  stageName: string;
  categoryId: string;
  subcategoryId: string;
  workTime: string;
  bio: string;
  aboutMe: string;
  languages: string;
  skills: string;
  privateShowTokenPerMinute: string;
  groupShowTokenPerMinute: string;
}

/** Exact pixel box for one gallery tile, or `null` before the grid has been
 *  measured (see the gallery tile-size math in `useEditProfile`). */
export type TileSize = { width: number; height: number } | null;

export type CalloutTone = 'cyan' | 'gold' | 'green';

export interface PasswordRule {
  label: string;
  ok: boolean;
}

export interface UseEditProfileResult {
  profile: ArtistProfile | undefined;
  categories: ArtistCategory[];
  photos: ArtistPhoto[];
  isLoading: boolean;
  loadError: boolean;
  refetchProfile: () => void;

  stageName: string;
  setStageName: Dispatch<SetStateAction<string>>;
  categoryId: string;
  subcategoryId: string;
  setSubcategoryId: Dispatch<SetStateAction<string>>;
  workTime: string;
  setWorkTime: Dispatch<SetStateAction<string>>;
  bio: string;
  setBio: Dispatch<SetStateAction<string>>;
  aboutMe: string;
  setAboutMe: Dispatch<SetStateAction<string>>;
  languages: string;
  setLanguages: Dispatch<SetStateAction<string>>;
  skills: string;
  setSkills: Dispatch<SetStateAction<string>>;
  privateShowTokenPerMinute: string;
  setPrivateShowTokenPerMinute: Dispatch<SetStateAction<string>>;
  groupShowTokenPerMinute: string;
  setGroupShowTokenPerMinute: Dispatch<SetStateAction<string>>;

  subcategories: ArtistSubcategory[];
  loadingSubcategories: boolean;
  handleSelectCategory: (id: string) => void;

  isSaving: boolean;
  handleSave: () => void;

  avatar: AvatarPickerResult;
  avatarUrl: string | null;

  handleAddPhoto: () => void;
  isUploadingPhoto: boolean;
  handleDeletePhoto: (photoId: string) => void;

  skillList: string[];

  galleryWidth: number;
  setGalleryWidth: Dispatch<SetStateAction<number>>;
  tileSize: TileSize;

  basicInfoDone: boolean;
  pricingDone: boolean;
  skillsDone: boolean;
  galleryDone: boolean;
  completenessPct: number;
  strengthHeadline: string;
}

export interface UseMobileNumberSectionResult {
  phone: string;
  phoneOtpStep: boolean;
  phoneOtp: string;
  setPhoneOtp: Dispatch<SetStateAction<string>>;
  onChangePhone: (v: string) => void;
  unchanged: boolean;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  handleSendPhoneOtp: () => void;
  handleVerifyPhoneOtp: () => void;
  cancelOtpStep: () => void;
}

export interface UseChangePasswordSectionResult {
  open: boolean;
  toggleOpen: () => void;
  oldPassword: string;
  setOldPassword: Dispatch<SetStateAction<string>>;
  newPassword: string;
  setNewPassword: Dispatch<SetStateAction<string>>;
  confirmPassword: string;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  showOld: boolean;
  toggleShowOld: () => void;
  showNew: boolean;
  toggleShowNew: () => void;
  showConfirm: boolean;
  toggleShowConfirm: () => void;
  passRules: { label: string; ok: boolean }[];
  handleUpdatePassword: () => void;
  isPending: boolean;
  disabled: boolean;
  handleCancel: () => void;
}
