import z from 'zod';

import { userSchema } from '../admin/account/schema.js';

export const userUpdateSchema = z
  .object(userSchema.shape)
  .pick({ displayName: true, image: true })
  .partial();
export type UserUpdate = z.infer<typeof userUpdateSchema>;
