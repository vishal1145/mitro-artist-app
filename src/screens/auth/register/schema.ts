import { z } from 'zod';

import { authPasswordSchema, mobileSchema, stageNameSchema } from '@utils/validators';

/**
 * Register form: stage name, mobile number, password.
 *
 * No display name — `POST /api/artist/auth/register` accepts only
 * `{ phone, stageName, password }`. The display name is set later from
 * Settings → Public details.
 */
export const registerSchema = z.object({
  username: stageNameSchema,
  mobile: mobileSchema,
  // Same rules as the User app: 8+ chars, a number, an uppercase letter.
  password: authPasswordSchema
    .refine((v) => /\d/.test(v), 'Contains a number')
    .refine((v) => /[A-Z]/.test(v), 'Contains an uppercase letter'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
