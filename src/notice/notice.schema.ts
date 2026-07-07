import { Types } from 'mongoose';
import z from 'zod';

//Mongoose ID Validation
const objectId = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Inavlid objectId',
});

//Base Notice Schema
export const baseNoticeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  expiresAt: z.coerce.date().optional(),
});

//Create a Notice
export const createNoticeSchema = baseNoticeSchema;

//Update a Notice
export const updateNoticeSchema = baseNoticeSchema;

export type CreateNoticeInputType = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInputType = z.infer<typeof updateNoticeSchema>;
