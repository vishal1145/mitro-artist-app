import { z } from 'zod';

import { mobileSchema } from '@utils/validators';

/** Forgot-password form — mobile number, matching the rest of auth. */
export const forgotPasswordSchema = z.object({
  mobile: mobileSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
