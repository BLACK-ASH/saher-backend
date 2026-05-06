import z from 'zod';
import { objectId } from '../../libs/utils/zod-object-id.js';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

const baseSchema = z.object({
  image: objectId(),
  amount: z.number(),
  dateOfPayment: dateField,
  adminNote: z.string().min(3).max(500),
});
export const createAdvanceBillSchema = baseSchema;
export const updateAdvanceBillSchema = baseSchema
  .omit({ dateOfPayment: true })
  .partial()
  .extend({ user: z.string().optional() });

export const advanceBillResponseSchema = z.object({
  user: z.string(),
  image: z.string(),
  amount: z.number(),
  dateOfPayment: dateField,
  adminNote: z.string(),
});
export const updateAdvanceBillResposeSchema = advanceBillResponseSchema
  .omit({ dateOfPayment: true })
  .partial();

export type createBillInputType = z.infer<typeof createAdvanceBillSchema>;
export type updateBillInputType = z.infer<typeof updateAdvanceBillSchema>;
