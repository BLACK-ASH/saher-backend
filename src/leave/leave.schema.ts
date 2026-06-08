import z from 'zod';

const leaveApplicationSchemaBase = z.object({
  leaveTypeCode: z
    .string()
    .toUpperCase()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters')
    .regex(/^[A-Z0-9_]+$/, 'Code can only contain uppercase letters, numbers, and underscores'),

  startDate: z.coerce.date(),

  endDate: z.coerce.date(),

  reason: z
    .string()
    .trim()
    .min(5, 'Reason is required')
    .max(400, 'Reason cannot exceed 400 characters'),

  proof: z.string().optional(),
});

export const createLeaveApplicationSchema = leaveApplicationSchemaBase.refine(
  (data) => data.endDate >= data.startDate,
  {
    path: ['endDate'],
    message: 'End date cannot be before start date',
  },
);

export const updateLeaveApplicationSchema = leaveApplicationSchemaBase.partial().refine(
  (data) => {
    // If only one date is being updated,
    // let the controller compare against the existing record.
    if (!data.startDate || !data.endDate) {
      return true;
    }

    return data.endDate >= data.startDate;
  },
  {
    path: ['endDate'],
    message: 'End date cannot be before start date',
  },
);

export const reviewLeaveApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),

  managerComment: z.string().trim().max(400, 'Comment cannot exceed 400 characters').optional(),
});

// ----------------LeaveType--------------

const leaveTypeSchemaBase = z.object({
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

  allocatedDays: z.number().int().min(1).max(365),

  maxCarryForwardDays: z.number().int().min(0).max(365),

  requiresProof: z.boolean().default(false),

  minDaysNotice: z.number().int().min(0).max(365),

  isActive: z.boolean().default(true),
});

export const createLeaveTypeSchema = leaveTypeSchemaBase.refine(
  (data) => data.maxCarryForwardDays <= data.allocatedDays,
  {
    path: ['maxCarryForwardDays'],
    message: 'Max carry forward days cannot exceed allocated days',
  },
);

export const updateLeaveTypeSchema = leaveTypeSchemaBase.partial().refine(
  (data) => {
    if (data.allocatedDays === undefined || data.maxCarryForwardDays === undefined) {
      return true;
    }

    return data.maxCarryForwardDays <= data.allocatedDays;
  },
  {
    path: ['maxCarryForwardDays'],
    message: 'Max carry forward days cannot exceed allocated days',
  },
);

// export type LeaveTypeT = z.infer<typeof createLeaveTypeSchema>
