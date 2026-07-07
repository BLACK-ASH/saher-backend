import z from 'zod';

export const createLogSchema = z.object({
  id: z.string(),
  date: z.coerce.string(),
  description: z.string().min(5).max(500),
  amount: z.number(),
  from: z.string(),
  to: z.string(),
});

export const createLogResponseSchema = createLogSchema;

export type CreateLogType = z.infer<typeof createLogSchema>;
export type CreateLogResponsiveType = z.infer<typeof createLogResponseSchema>;
