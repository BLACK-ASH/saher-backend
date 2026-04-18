import z from 'zod';
import { userSchema } from '../admin/account/schema.js';

export const userUpdateSchema = userSchema.pick({ displayName: true, image: true }).partial();
export type UserUpdate = z.infer<typeof userUpdateSchema>;
