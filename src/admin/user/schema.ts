import { userSchema } from '../account/account.schema.js';
import z from 'zod';

export const userUpdateSchema = userSchema.pick({ displayName: true, image: true }).partial();
export type UserUpdate = z.infer<typeof userUpdateSchema>;
