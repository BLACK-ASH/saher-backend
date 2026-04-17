import { Types } from 'mongoose';
import z, { date } from 'zod';
import { convertToObjectId } from '../../libs/utils/convert-object-id.js';

export const objectId = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ID',
  })
  .transform((e) => {
    return convertToObjectId(e);
  });

const dateField = z
  .union([z.string().datetime(), z.date()])
  .transform((val) => new Date(val))
  .refine((date) => !isNaN(date.getTime()), {
    message: 'Invalid date',
  });

export const baseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5).max(500),
  date: z.string(),
  startTime: dateField,
  endTime: dateField,
  speaker: z.array(objectId),
});

export const createSessionSchema = baseSchema.refine((data) => data.endTime > data.startTime, {
  message: 'endtime must be after start time',
  path: ['endTime'],
});

export const updatedSessionSchema = baseSchema.partial().refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  },
);

export type CreateSessionInputType = z.infer<typeof createSessionSchema>;

export type UpdatedSessionInputType = z.infer<typeof updatedSessionSchema>;
