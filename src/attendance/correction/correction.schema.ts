import z from 'zod';

import { userSchemaFinal } from '../../admin/_services/user.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

export const attendanceCorrectionSchema = z
  .object({
    attendanceId: objectId('Invalid Attendance Id.'),
    message: z.string().min(3).max(300),
    inTime: z.coerce.date(),
    outTime: z.coerce.date(),
    proof: z.string().optional(),
  })
  .refine(
    (value) => value.outTime > value.inTime,
    { message: 'Check Out Time Must Be After Check In Time.', path: ['outTime'] },
  );

export const attendanceCorrectionHandleSchema = z.object({
  changes: z
    .object({
      inTime: z.coerce.date(),
      outTime: z.coerce.date(),
      status: z.enum(['absent', 'half-day', 'present']),
      isLate: z.boolean(),
    })
    .refine(
      (changes) => changes.outTime > changes.inTime,
      { message: 'Check out time must be after check in time.', path: ['outTime'] },
    )
    .optional(),

  reason: z.string().max(300, 'Maximum Reason Is 300 Characters.').optional(),

  status: z.enum(['reject', 'on-hold', 'approve']),
});

export const attendancePreviousSchema = z.object({
  inTime: z.coerce.date().nullable(),
  outTime: z.coerce.date().nullable(),
  status: z.enum(['absent', 'half-day', 'present']),
  isLate: z.boolean(),
});

export const attendanceRecordSchema = z.object({
  inTime: z.coerce.date(),
  outTime: z.coerce.date(),
  status: z.enum(['absent', 'half-day', 'present']),
  isLate: z.boolean(),
});

export const attendanceChangesSchema = z.object({
  inTime: z.coerce.date(),
  outTime: z.coerce.date(),
  status: z.enum(['absent', 'half-day', 'present']).optional(),
  isLate: z.boolean().optional(),
});

export const correctionResponseSchema = z.object({
  id: z.string(),
  user: userSchemaFinal,
  attendance: z.object({
    id: z.string(),
    date: z.string(),
  }),
  previous: attendancePreviousSchema,
  changes: attendanceChangesSchema,
  status: z.string(),
  proof: z
    .object({
      id: z.string(),
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  message: z.string(),
  reason: z.string(),
  manager: userSchemaFinal.optional(),
});

export const correctionResponsListSchema = z.array(correctionResponseSchema);

export type AttendanceCorrectionInputType = z.infer<typeof attendanceCorrectionSchema>;
export type AttendanceCorrectionHandleInputType = z.infer<typeof attendanceCorrectionHandleSchema>;
export type AttendanceCorrectionResponse = z.infer<typeof correctionResponseSchema>;
