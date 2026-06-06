import z from 'zod';

const leaveType = ['paid', 'unpaid', 'sick', 'other'];
export const leaveSchema = z.object({
  type: z.enum(leaveType),
  reason: z.string(),
  date: z.date(),
});

export const leaveTypeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters'),

    description: z.string().trim().max(400, 'Description cannot exceed 400 characters').optional(),

    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'Code must be at least 2 characters')
      .max(10, 'Code cannot exceed 10 characters')
      .regex(/^[A-Z0-9_]+$/, 'Code can only contain uppercase letters, numbers, and underscores'),

    allocatedDays: z
      .number()
      .int()
      .min(1, 'Allocated days must be at least 1')
      .max(365, 'Allocated days cannot exceed 365'),

    maxCarryForwardDays: z
      .number()
      .int()
      .min(0, 'Carry forward days cannot be negative')
      .max(365, 'Carry forward days cannot exceed 365'),

    requiresProof: z.boolean().default(false),

    minDaysNotice: z
      .number()
      .int()
      .min(0, 'Minimum notice cannot be negative')
      .max(365, 'Minimum notice cannot exceed 365'),

    isActive: z.boolean().default(true),
  })
  .refine((data) => data.maxCarryForwardDays <= data.allocatedDays, {
    path: ['maxCarryForwardDays'],
    message: 'Max carry forward days cannot exceed allocated days',
  });
export type LeaveSchemaType = z.infer<typeof leaveSchema>;
