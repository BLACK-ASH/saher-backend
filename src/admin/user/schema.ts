import type z from 'zod';

import { hashPassword } from '../../libs/utils/password-hash.js';
import { userSchema } from '../account/schema.js';

export const userUpdateSchema = userSchema.partial().transform(async (data) => {
  if (data.password) {
    data.password = await hashPassword(data.password);
  }
  return data;
});
export type UserUpdate = z.infer<typeof userUpdateSchema>;
