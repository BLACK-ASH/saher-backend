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
  expiresAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: 'Expiry date must be present or future',
    })
    .optional(),
});

//Create a Notice
export const createNoticeSchema = baseNoticeSchema;

//Response Schema
export const getNoticeSchema = baseNoticeSchema.extend({ id: objectId });

//Update a Notice
export const updateNoticeSchema = baseNoticeSchema.partial();

export type CreateNoticeInputType = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInputType = z.infer<typeof updateNoticeSchema>;
export type GetNoticeType = z.infer<typeof getNoticeSchema>;
