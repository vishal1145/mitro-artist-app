import { z } from 'zod';

import { stageNameSchema } from '@utils/validators';

/**
 * Limits for the editable profile fields.
 *
 * The server has the final say — these exist so the artist is told inline
 * while typing rather than after pressing Save and waiting on a round trip.
 * If the API turns out to be stricter, tighten these to match.
 */
export const SETTINGS_LIMITS = {
  bio: 160,
  aboutMe: 500,
  rate: { min: 1, max: 9999 },
} as const;

/**
 * A token rate, held as a string because that's what a TextInput gives back.
 * Parsed to a number only at submit.
 */
const rateField = z
  .string()
  .trim()
  .min(1, 'Enter a rate')
  .regex(/^\d+$/, 'Numbers only')
  .refine(
    (value) => {
      const parsed = Number(value);
      return parsed >= SETTINGS_LIMITS.rate.min && parsed <= SETTINGS_LIMITS.rate.max;
    },
    `Between ${SETTINGS_LIMITS.rate.min} and ${SETTINGS_LIMITS.rate.max}`,
  );

export const settingsSchema = z.object({
  stageName: stageNameSchema,
  bio: z
    .string()
    .trim()
    .max(SETTINGS_LIMITS.bio, `Keep your bio under ${SETTINGS_LIMITS.bio} characters`),
  aboutMe: z
    .string()
    .trim()
    .max(SETTINGS_LIMITS.aboutMe, `Keep this under ${SETTINGS_LIMITS.aboutMe} characters`),
  privateRate: rateField,
  groupRate: rateField,
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
