import z from 'zod';

import { userSchemaFinal } from '../../admin/_services/user.js';
import { DOMPurify } from '../../libs/utils/dompurify.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

export const baseSchema = z.object({
  title: z.string().min(3),
  description: z
    .string()
    .min(5)
    .transform((value) => DOMPurify.sanitize(value)),
  date: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  speaker: z.array(objectId()).min(1, 'Session Must Have Atleast One Speaker.'),
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

export const getSessionResponseSchema = z.object({
  id: z.string(),
  programId: z.object({ id: z.string(), title: z.string() }),
  workshopId: z.object({ id: z.string(), title: z.string() }),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  speaker: z.array(userSchemaFinal),
});

export const getSessionSchema = z.array(getSessionResponseSchema);
export const getSessionByIdSchema = getSessionResponseSchema;

export const createSessionResponseSchema = baseSchema;
export const UpdatesSessionResponseSchema = baseSchema;
export type CreateSessionInputType = z.infer<typeof createSessionSchema>;
export type UpdatedSessionInputType = z.infer<typeof updatedSessionSchema>;
export type SessionResponseT = z.infer<typeof getSessionResponseSchema>;
