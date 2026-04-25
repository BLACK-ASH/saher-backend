import z from 'zod';
import { objectId } from '../../libs/utils/zod-object-id.js';

const dateField = z.union([z.string(), z.date(), z.null()]).transform((val) => {
  if (val === null || val === undefined) return null;
  return new Date(val);
});

export const attendanceCorrectionSchema = z.object({
  attendanceId: objectId('Invalid Attendance Id.'),
  message: z.string().min(3).max(300),
  inTime: z.coerce.date(),
  outTime: z.coerce.date(),
  proof: z.string().optional(),
});

export const attendanceCorrectionHandleSchema = z
  .object({
    changes: z.object({
      inTime: z.coerce.date(),
      outTime: z.coerce.date(),
      status: z.enum(['absent', 'half-day', 'present']).optional(),
      isLate: z.boolean().optional(),
    }),
    isAdmin: z.boolean(),
    reason: z.string().max(300, 'Maximum Reason Is 300 Characters.').optional(),
    status: z.enum(['reject', 'pending', 'on-hold', 'approve']),
  })
  .refine(
    (data) => {
      if (data.isAdmin) {
        return !!data.changes.status && !!data.changes.isLate;
      }
      return true;
    },
    {
      message: 'All The Fields Are Required.',
    },
  );

export const attendanceRecordSchema = attendanceCorrectionSchema.omit({
  attendanceId: true,
  message: true,
  proof: true,
});
export type AttendanceCorrectionInputType = z.infer<typeof attendanceCorrectionSchema>;
export type AttendanceCorrectionHandleInputType = z.infer<typeof attendanceCorrectionHandleSchema>;
