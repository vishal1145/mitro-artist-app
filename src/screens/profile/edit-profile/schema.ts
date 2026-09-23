import type { PasswordRule } from './types';

/** `.gallery-grid` — three across, 10px between. Both feed the tile maths. */
export const GALLERY_COLS = 3;
export const GALLERY_GAP = 10;

/**
 * The server stores E.164 ("+919876543210"); this input is the 10-digit
 * national part, so strip everything else on the way in. Seeding it with the
 * raw value let `maxLength={10}` swallow three digits behind the "+91", so
 * the field showed a truncated number and the "Change" button's
 * already-current check never lined up.
 */
export const nationalDigits = (v: string | null | undefined): string =>
  (v ?? '').replace(/\D/g, '').slice(-10);

export const isValidNationalPhone = (phone: string): boolean => phone.length === 10;

export const isValidOtp = (otp: string): boolean => otp.length === 6;

export const getPasswordRules = (newPassword: string): PasswordRule[] => [
  { label: 'At least 8 characters', ok: newPassword.length >= 8 },
  { label: 'Contains a number', ok: /\d/.test(newPassword) },
  { label: 'Contains an uppercase letter', ok: /[A-Z]/.test(newPassword) },
];

export const basicInfoDone = (stageName: string): boolean => !!stageName.trim();

export const pricingDone = (
  privateShowTokenPerMinute: string,
  groupShowTokenPerMinute: string,
): boolean =>
  Number(privateShowTokenPerMinute) > 0 && Number(groupShowTokenPerMinute) > 0;

export const skillsDone = (skillList: string[]): boolean => skillList.length > 0;

export const galleryDone = (photoCount: number): boolean => photoCount > 0;

export const computeCompletenessPct = (
  isBasicInfoDone: boolean,
  isPricingDone: boolean,
  isSkillsDone: boolean,
  isGalleryDone: boolean,
): number =>
  (isBasicInfoDone ? 25 : 0) +
  (isPricingDone ? 25 : 0) +
  (isSkillsDone ? 25 : 0) +
  (isGalleryDone ? 25 : 0);

export const computeStrengthHeadline = (
  completenessPct: number,
  isSkillsDone: boolean,
  isGalleryDone: boolean,
): string =>
  completenessPct >= 100
    ? 'Your profile is complete and fan-ready'
    : !isSkillsDone && !isGalleryDone
      ? 'Add skills and a gallery photo to reach 100%'
      : !isSkillsDone
        ? 'Add your skills to boost discovery'
        : !isGalleryDone
          ? 'Add a gallery photo to reach 100%'
          : 'Fill in your basic info and pricing to reach 100%';
