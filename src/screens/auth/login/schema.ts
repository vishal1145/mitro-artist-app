import { z } from 'zod';

import { LIMITS } from '@utils/validators';

/**
 * The server takes a single `phoneOrStageName` field and works out which it
 * is, so this validates a relaxed identifier rather than a specific format.
 * Password uses length-only rules here — full complexity is enforced at
 * registration.
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your mobile number or stage name.')
    .max(255, 'That value is too long.'),
  password: z
    .string()
    .min(LIMITS.password.min, 'Enter your password.')
    .max(LIMITS.password.max, 'That password is too long.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
