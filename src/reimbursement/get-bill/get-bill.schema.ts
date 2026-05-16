import z from 'zod';

import { objectId } from '../../libs/utils/zod-object-id.js';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

export const getBillSchema = z.object({
  user: z.string(),
  image: z.string().optional(),
  amount: z.number(),
  advance: z.number(),
  date: dateField,
  description: z.string().default(''),
  status: z.enum(['pending', 'accept', 'reject', 'on-hold']),
  reason: z.string().optional(),
  isDeleted: z.boolean(),
});

export type GetBillSchemaInputType = z.infer<typeof getBillSchema>;
