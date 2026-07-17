import z from 'zod';

import { userSchemaFinal } from '../../admin/_services/user.js';
import { DOMPurify } from '../../libs/utils/dompurify.js';
import { imageType, objectId } from '../../libs/utils/zod-object-id.js';
import { getBillResponseSchema } from '../../reimbursement/get-bill/get-bill.schema.js';

export const baseSchema = z.object({
  title: z.string().min(1),
  description: z
    .string()
    .min(1)
    .transform((value) => DOMPurify.sanitize(value)),
  date: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Date must be present or future',
  }),
  startTime: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Start time must be present or future',
  }),
  endTime: z.coerce.date(),
  images: z.array(objectId()).optional(),
  review: z
    .string()
    .optional()
    .transform((value) => value && DOMPurify.sanitize(value)),
  speaker: z.array(objectId()).min(1, 'Session Must Have Atleast One Speaker.'),
  workshop: objectId().optional(),
  bill: z.array(objectId()).optional(),
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

export const sessionResponse = baseSchema.omit({ images: true, speaker: true, bill: true }).extend({
  id: z.string(),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  program: z.object({ id: z.string(), title: z.string() }),
  workshop: z.object({ id: z.string(), title: z.string() }),
  speaker: z.array(userSchemaFinal),
  images: imageType.array().optional(),
  bill: z.array(getBillResponseSchema).optional(),
});

export const createSessionResponseSchema = baseSchema;
export const UpdatesSessionResponseSchema = baseSchema;
export type CreateSessionInputType = z.infer<typeof createSessionSchema>;
export type UpdatedSessionInputType = z.infer<typeof updatedSessionSchema>;
export type SessionResponseT = z.infer<typeof sessionResponse>;
