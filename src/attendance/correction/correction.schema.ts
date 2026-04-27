import z from 'zod';
import { objectId } from '../../libs/utils/zod-object-id.js';

export const attendanceCorrectionSchema = z.object({
  attendanceId: objectId('Invalid Attendance Id.'),
  message: z.string().min(3).max(300),
  inTime: z.coerce.date(),
  outTime: z.coerce.date(),
  proof: z.string().optional(),
});

export const attendanceCorrectionHandleSchema = z
  .object({
    changes: z
      .object({
        inTime: z.coerce.date(),
        outTime: z.coerce.date(),
        status: z.enum(['absent', 'half-day', 'present']),
        isLate: z.boolean(),
      })
      .optional(),

    isAdmin: z.boolean(),

    reason: z.string().max(300, 'Maximum Reason Is 300 Characters.').optional(),

    status: z.enum(['reject', 'on-hold', 'approve']),
  })
  .superRefine((data, ctx) => {
    if (data.isAdmin) {
      if (!data.changes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Changes are required for admin correction.',
          path: ['changes'],
        });
        return;
      }

      const { inTime, outTime, status, isLate } = data.changes;

      if (!inTime || !outTime || !status || isLate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'All change fields are required for admin correction.',
          path: ['changes'],
        });
      }
    }
  });

export const attendancePreviousSchema = z.object({
  inTime: z.coerce.date().nullable(),
  outTime: z.coerce.date().nullable(),
  status: z.enum(['absent', 'half-day', 'present']),
  isLate: z.boolean(),
});

export const attendanceChangesSchema = z.object({
  inTime: z.coerce.date(),
  outTime: z.coerce.date(),
  status: z.enum(['absent', 'half-day', 'present']),
  isLate: z.boolean(),
});

export const correctionResponseSchema = z.object({
  id: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }),
  attendance: z.object({
    id: z.string(),
    date: z.string(),
  }),
  previous: attendancePreviousSchema,
  changes: attendanceChangesSchema,
  status: z.string(),
  message: z.string(),
  reason: z.string(),
  manager: z
    .object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
    })
    .optional(),
});

export const correctionResponsListSchema = z.array(correctionResponseSchema);

export type AttendanceCorrectionInputType = z.infer<typeof attendanceCorrectionSchema>;
export type AttendanceCorrectionHandleInputType = z.infer<typeof attendanceCorrectionHandleSchema>;
