import z from 'zod';

export const AttendanceSchemaFinal = z.object({
  id: z.string(),
  user: z.string(),
  inTime: z.string(),
  outTime: z.string().optional().nullable(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AttendanceResponseSchema = z.object({
  user: z.string(),
  inTime: z.string(),
  outTime: z.string().nullable().optional(),
  workHours: z.number(),
  date: z.string(),
  status: z.string(),
  isLate: z.boolean(),
});
