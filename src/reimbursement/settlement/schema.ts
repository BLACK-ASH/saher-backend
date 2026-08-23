import z from 'zod';

import { billStatus } from '../../database/bill.model.js';
import { settleStatus } from '../../database/settlement.model.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

// id is a response virtual — never required on input
export const settleSchema = z.object({
  id: z.string().optional(),
  bill: objectId(),
  user: objectId(),
  amount: z.coerce.number(),
  mode: z.string(),
  description: z.string(),
  manager: objectId(),
  date: z.coerce.date(),
  settleDate: z.coerce.date(),
  status: z.enum(settleStatus).optional(),
  expiredAt: z.coerce.date(),
});

export const createSettleSchema = settleSchema.pick({
  id: true,
  bill: true,
  user: true,
  amount: true,
  mode: true,
  description: true,
  manager: true,
  date: true,
  expiredAt: true,
});

export const handleSettleSchema = settleSchema.pick({
  mode: true,
  status: true,
  description: true,
});

export const handleBillSchema = z.object({
  status: z.enum(billStatus),
  reason: z.string(),
});

export type SettlementSchemaInputType = z.infer<typeof settleSchema>;
export type HandleCreateSchemaInputType = z.infer<typeof createSettleSchema>;
export type HandleSetttleSchemaInputType = z.infer<typeof handleSettleSchema>;
export type HandleBillSchemaInputType = z.infer<typeof handleBillSchema>;

// POST /rem/bill/handle/bill_id - handle bill (bill calculation and settelment creation)
// POST /rem/bill/settelment/(bill_id/settelment_id) - handle bill settelment request
