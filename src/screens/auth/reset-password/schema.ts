import { z } from 'zod';

import { authPasswordSchema } from '@utils/validators';

/**
 * New password + confirmation.
 *
 * The server checks the match too, but catching it here means the artist sees
 * it under the field as they type rather than after a round trip.
 */
export const resetPasswordSchema = z
  .object({
    newPassword: authPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    // Attach to the confirm field — that's the one the artist would retype.
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
