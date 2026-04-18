import { userSchema } from '../account/schema.js';
import z from 'zod';

export const userUpdateSchema = userSchema.partial();
export type UserUpdate = z.infer<typeof userUpdateSchema>;
