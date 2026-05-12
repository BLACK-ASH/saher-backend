import z from 'zod';
import { objectId } from '../../libs/utils/zod-object-id.js';
import { settleStatus } from '../../database/settlement.model.js';
import { billStatus } from '../../database/bill.model.js';

export const settleSchema = z.object({
  bill: objectId(),
  amount: z.coerce.number(),
  mode: z.string(),
  manager: objectId(),
  date: z.coerce.date(),
  settleDate: z.coerce.date(),
  status: z.enum(settleStatus).optional(),
  expiredAt: z.coerce.date(),
});

export const createSettleSchema = settleSchema.pick({
  bill: true,
  amount: true,
  mode: true,
  manager: true,
  date: true,
  expiredAt: true,
});
export const handleSettleSchema = settleSchema.pick({
  mode: true,
  settleDate: true,
  status: true,
});

export const handleBillSchema = z.object({
  status: z.enum(billStatus),
  reason: z.string(),
});

export type settlementSchemaInputType = z.infer<typeof settleSchema>;
export type handleCreateSchemaInputType = z.infer<typeof createSettleSchema>;
export type handleSetttleSchemaInputType = z.infer<typeof handleSettleSchema>;
export type handleBillSchemaInputType = z.infer<typeof handleBillSchema>;

// POST /rem/bill/handle/bill_id - handle bill (bill calculation and settelment creation)
// POST /rem/bill/settelment/(bill_id/settelment_id) - handle bill settelment request
