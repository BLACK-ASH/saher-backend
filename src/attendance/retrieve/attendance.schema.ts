import z from 'zod';

import { userSchemaFinal } from '../../admin/_services/user.js';

// NOTE: Make only one not multiple
export const attendanceResponseSchema = z
  .object({
    id: z.string(),
    user: userSchemaFinal,
    inTime: z.string().nullable(),
    outTime: z.string().nullable(),
    workHours: z.number(),
    date: z.string(),
    status: z.enum(['present', 'half-day', 'absent']),
    isLate: z.boolean(),
  })
  .readonly();

export const attendanceListSchema = z.array(attendanceResponseSchema);

// Types
export type AttendanceResponseT = z.infer<typeof attendanceResponseSchema>;
export type AttendanceListT = z.infer<typeof attendanceListSchema>;
