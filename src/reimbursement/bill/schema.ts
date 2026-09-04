import z from 'zod';

import { billStatus } from '../../database/bill.model.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

// id is a response virtual — never required on input
export const billSchema = z.object({
  id: z.string().optional(),
  user: objectId(),
  images: z.array(objectId()).min(1),
  advance: z.coerce.number().min(0),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  date: z.coerce.date(),
  manager: objectId().optional(),
  status: z.enum(billStatus),
  description: z
    .string()
    .min(5, 'Description Is Required.')
    .max(50, 'Max Lenght Is 50 Characters.'),
  reason: z
    .string()
    .min(5, 'Description Is Required.')
    .max(50, 'Max Lenght Is 50 Characters.')
    .optional(),
});

export const userBillCreateSchema = billSchema.pick({
  id: true,
  amount: true,
  description: true,
  date: true,
  images: true,
});
export const userBillUpdateSchema = billSchema
  .pick({ id: true, amount: true, description: true, images: true })
  .partial();

export const adminBillCreatSchema = billSchema.pick({
  id: true,
  advance: true,
  date: true,
  description: true,
});
export const adminBillUpdateSchema = billSchema
  .pick({ id: true, advance: true, description: true })
  .partial();

export type UserCreateSchemaType = z.infer<typeof userBillCreateSchema>;
export type UserUpdateSchemaInputType = z.infer<typeof userBillUpdateSchema>;
export type AdminCreatSchemaInputType = z.infer<typeof adminBillCreatSchema>;
export type AdminUpdateSchemaInputType = z.infer<typeof adminBillUpdateSchema>;

// POST /rem/bill - user create
// PATCH /rem/bill/bill_id - user bill update

// POST /rem/bill/admin/user_id - admin create
// PATCH /rem/bill/admin/bill_id - admin bill update
