import { z } from 'zod';

import { LIMITS } from '@utils/validators';

/**
 * Login accepts an email OR a username as the identifier, so we validate a
 * relaxed identifier rather than a strict email. Password uses length-only
 * rules here (full complexity is enforced at registration).
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or username.')
    .max(255, 'That value is too long.'),
  password: z
    .string()
    .min(LIMITS.password.min, 'Enter your password.')
    .max(LIMITS.password.max, 'That password is too long.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
