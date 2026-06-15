import z from 'zod';

import { objectId } from '../../libs/utils/zod-object-id.js';

export const createLogSchema = z.object({
  date: z.coerce.string(),
  description: z.string().min(5).max(500),
  amount: z.number(),
  from: z.string(),
  to: z.string(),
});

export const createLogResponsiveSchema = createLogSchema.extend({ status: z.string() });

export type CreateLogType = z.infer<typeof createLogSchema>;
export type CreateLogResponsiveType = z.infer<typeof createLogResponsiveSchema>;
