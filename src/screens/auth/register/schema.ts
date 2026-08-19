import { z } from 'zod';

import {
  authPasswordSchema,
  displayNameSchema,
  mobileSchema,
  stageNameSchema,
} from '@utils/validators';

/** Register form: display name, stage name, mobile number, password. */
export const registerSchema = z.object({
  name: displayNameSchema,
  username: stageNameSchema,
  mobile: mobileSchema,
  password: authPasswordSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
