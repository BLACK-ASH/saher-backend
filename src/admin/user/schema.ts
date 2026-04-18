import { userSchema } from '../account/schema.js';
import z from 'zod';

export const adminUserUpdateSchema = z
  .object(userSchema.shape)
  .partial()
  .refine(
    (data) => {
      if (data.name === undefined) return true;
      return /^[a-zA-Z]/.test(data.name) && !/[_-]$/.test(data.name);
    },
    {
      message: 'Name must start with a letter and cannot end with _ or -',
      path: ['name'],
    },
  );

export type UserUpdate = z.infer<typeof adminUserUpdateSchema>;
