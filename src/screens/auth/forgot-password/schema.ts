import { z } from 'zod';

import { emailSchema } from '@utils/validators';

/** Forgot-password form schema. */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
