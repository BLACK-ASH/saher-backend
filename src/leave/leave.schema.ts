import z from 'zod';

const leaveType = ['paid', 'unpaid', 'sick', 'other'];
export const leaveSchema = z.object({
  type: z.enum(leaveType),
  reason: z.string(),
  date: z.date(),
});
export type LeaveSchemaType = z.infer<typeof leaveSchema>;
