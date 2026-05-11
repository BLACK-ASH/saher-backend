import z from 'zod';
import { objectId } from '../../libs/utils/zod-object-id.js';
import { billStatus } from '../../database/bill.model.js';

// id: bill_1234
// user: user_1234
// advance: xx
// amount: xx
// date: date
// status
// manger: user_0987

export const billSchema = z.object({
  // id: objectId(),
  user: objectId(),
  image: z.array(objectId()).min(1),
  advance: z.coerce.number(),
  amount: z.coerce.number(),
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
  amount: true,
  description: true,
  date: true,
  image: true,
});
export const userBillUpdateSchema = billSchema
  .pick({ amount: true, description: true, image: true })
  .partial();

export const adminBillCreatSchema = billSchema.pick({
  user: true,
  advance: true,
  date: true,
  reason: true,
});
export const adminBillUpdateSchema = billSchema.pick({ advance: true, reason: true }).partial();

export type userCreateSchemaType = z.infer<typeof userBillCreateSchema>;
export type userUpdateSchemaInputType = z.infer<typeof userBillUpdateSchema>;
export type adminCreatSchemaInputType = z.infer<typeof adminBillCreatSchema>;
export type adminUpdateSchemaInputType = z.infer<typeof adminBillUpdateSchema>;

// POST /rem/bill - user create
// PATCH /rem/bill/bill_id - user bill update

// POST /rem/bill/admin/user_id - admin create
// PATCH /rem/bill/admin/bill_id - admin bill update
