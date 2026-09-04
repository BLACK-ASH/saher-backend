import z from 'zod';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

export const searchBillQuerySchema = z.object({
  description: z.string().optional(),
  amount: z.coerce.number().optional(),
  user: z.string().optional(),
  status: z.enum(['pending', 'accept', 'reject', 'on-hold', 'all']).optional(),
  date: z.string().datetime().optional(),
  isDeleted: z.union([z.boolean(), z.enum(['true', 'false'])]).optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }).default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(5),
});

export const getBillResponseSchema = z.object({
  id: z.string(),
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

export const getSettleBillResponseSchema = z.object({
  id: z.string(),
  bill: z.string(),
  user: z.string(),
  amount: z.number(),
  mode: z.enum(['cash', 'upi', 'cheque', '-']),
  date: dateField,
  manager: z.string(),
  status: z.enum(['pending', 'settle', 'expired', 'on-hold']),
  expiredAt: dateField,
  settleDate: dateField.optional(),
});

export type SearchBillQuerySchemaInputType = z.infer<typeof searchBillQuerySchema>;
export type GetBillResponsiveSchemaInputType = z.infer<typeof getBillResponseSchema>;
export type GetSettleBillResponsiveSchemaInputType = z.infer<typeof getSettleBillResponseSchema>;
