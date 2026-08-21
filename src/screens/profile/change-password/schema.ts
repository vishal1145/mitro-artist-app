import { z } from 'zod';

import { authPasswordSchema } from '@utils/validators';

/**
 * Change password: current, new, confirm.
 *
 * Two rules beyond the field ones — the confirmation has to match, and the new
 * password has to differ from the old. The server enforces both; catching them
 * here means the artist sees it under the field instead of after a round trip.
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Enter your current password'),
    newPassword: authPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((v) => v.oldPassword !== v.newPassword, {
    message: 'Choose a password you haven’t used here before',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
