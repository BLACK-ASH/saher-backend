import type z from 'zod';

import { userSchema } from '../account/schema.js';

export const userUpdateSchema = userSchema.partial();
export type UserUpdate = z.infer<typeof userUpdateSchema>;
