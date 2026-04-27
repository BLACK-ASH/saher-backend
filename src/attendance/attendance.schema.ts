import z from 'zod';

export const AttendanceSchemaFinal = z.object({
  id: z.string(),
  user: z.string(),
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AttendanceResponseSchema = z.object({
  id: z.string(),
  user: z.string(),
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
});

// NOTE: Make only one not multiple
export const attendanceSchema = z.object({
  id: z.string(),
  user: z.string(),
  inTime: z.string().nullable(),
  outTime: z.string().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
});
