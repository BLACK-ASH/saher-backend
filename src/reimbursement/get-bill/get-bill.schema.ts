import z from 'zod';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

export const getBillResponsiveSchema = z.object({
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

export const getSettleBillResponsiveSchema = z.object({
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

// export const searchbillSchema = z.object({

// })

export type GetBillResponsiveSchemaInputType = z.infer<typeof getBillResponsiveSchema>;
export type GetSettleBillResponsiveSchemaInputType = z.infer<typeof getSettleBillResponsiveSchema>;
