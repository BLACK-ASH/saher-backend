import { userSchema } from '../account/schema.js';
import z from 'zod';

export const adminUserUpdateSchema = userSchema.partial();
export type UserUpdate = z.infer<typeof adminUserUpdateSchema>;
