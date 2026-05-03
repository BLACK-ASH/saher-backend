import z, { object } from 'zod';
import { objectId } from '../../libs/utils/zod-object-id.js';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

export const reviewResponseSchema = z.object({
  user: z.string(),
  image: z.string(),
  amount: z.number(),
  dateOfPayment: dateField,
  description: z.string().default(''),
  status: z.enum(['pending', 'accepted', 'rejected']),
  adminNote: z.string().default(''),
  createdBy: z.string().default(''),
});
