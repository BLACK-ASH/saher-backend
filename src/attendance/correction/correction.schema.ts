import z from 'zod';
import { attendanceStatus } from '../../database/attendance.model.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

const dateField = z.union([z.string(), z.date(), z.null()]).transform((val) => {
  if (val === null || val === undefined) return null;
  return new Date(val);
});

export const attendanceCorrectionSchema = z.object({
  attendanceId: objectId('Invalid Attendance Id.'),
  message: z.string().min(3).max(300),
  inTime: dateField,
  outTime: dateField,
  isLate: z.boolean().optional(),
  status: z.enum(attendanceStatus).optional(),
  proof: z.string().optional(),
});

export const attendanceCorrectionHandleSchema = z.object({
  changes: z.object({
    inTime: dateField,
    outTime: dateField,
    status: z.enum(['absent', 'half-day', 'present']),
  }),
  reason: z.string().max(300, 'Maximum Reason Is 300 Characters.').optional(),
  status: z.enum(['reject', 'pending', 'on-hold', 'approve']),
});

export const attendanceRecordSchema = attendanceCorrectionSchema.omit({
  attendanceId: true,
  message: true,
  proof: true,
});
export type AttendanceCorrectionInputType = z.infer<typeof attendanceCorrectionSchema>;
export type AttendanceCorrectionHandleInputType = z.infer<typeof attendanceCorrectionHandleSchema>;
