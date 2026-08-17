import { z } from 'zod';

import {
  emailSchema,
  nameSchema,
  passwordSchema,
  usernameSchema,
} from '@utils/validators';

/** Register form schema (name, username, email, password). */
export const registerSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
