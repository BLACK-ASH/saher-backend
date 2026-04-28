import z from 'zod';
import { shortUserSchema } from '../../admin/_services/user.js';

// export const AttendanceSchemaFinal = z.object({
//   id: z.string(),
//   user: z.string(),
//   inTime: z.string().nullable(),
//   outTime: z.string().nullable(),
//   workHours: z.number(),
//   date: z.string(),
//   status: z.string(),
//   isLate: z.boolean(),
//   createdAt: z.string(),
//   updatedAt: z.string(),
// });

// export const AttendanceResponseSchema = z.object({
//   id: z.string(),
//   user: z.string(),
//   inTime: z.string().nullable(),
//   outTime: z.string().nullable(),
//   workHours: z.number(),
//   date: z.string(),
//   status: z.string(),
//   isLate: z.boolean(),
// });

// NOTE: Make only one not multiple
export const attendanceResponseSchema = z
  .object({
    id: z.string(),
    user: shortUserSchema,
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
