import { z } from 'zod';

export const createPaymentSchema = z.object({
  reimbursement: z.string().min(1),
  billImg: z.string().min(1),
  paidAmount: z.number().positive(),
  requestType: z.enum(['USER_REIMBURSEMENT', 'ADMIN_RECOVERY']),
  recoveryAmount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

export const paymentIdSchema = z.object({
  id: z.string().min(1, 'Payment ID is required'),
});

export const paymentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CLEARED'] as const, 'Invalid status'),
  clearedBy: z.string().optional(),
  clearedByRole: z.enum(['ADMIN', 'MANAGER'] as const).optional(),
  paidAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const createRecoverySchema = z.object({
  reimbursement: z.string().min(1),
  recoveryAmount: z.number().positive('Recovery amount required'),
  notes: z.string().optional(),
});
