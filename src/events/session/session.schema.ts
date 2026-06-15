import DOMPurify from 'dompurify';
import { Types } from 'mongoose';
import z from 'zod';

import { objectId } from '../../libs/utils/zod-object-id.js';

export const baseSchema = z.object({
  workshopId: objectId().optional(),
  title: z.string().min(3),
  description: z
    .string()
    .min(5)
    .max(500)
    .transform((value) => DOMPurify.sanitize(value)),

  date: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  speaker: z.array(objectId()),
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

export const getSessionResponsiveSchema = z.object({
  workshopId: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  speaker: z.array(
    z.object({
      id: z.string(),
    }),
  ),
});

export const getSessionSchema = z.array(getSessionResponsiveSchema);
export const getSessionByIdSchema = getSessionResponsiveSchema;

export const createSessionResponseSchema = baseSchema;
export const UpdatesSessionResponseSchema = baseSchema;
export type CreateSessionInputType = z.infer<typeof createSessionSchema>;
export type UpdatedSessionInputType = z.infer<typeof updatedSessionSchema>;
