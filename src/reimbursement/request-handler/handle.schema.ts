import z from 'zod';

export const updateAdminSchema = z.object({
  status: z.string(),
  adminNote: z.string(),
});

export const updateAdminResponseSchema = z.object({
  user: z.string(),
  image: z.string(),
  amount: z.number(),
  dateOfPayment: z.string(),
  description: z.string(),
  status: z.string(),
  adminNote: z.string(),
  createdBy: z.string(),
});

export const updateUserSchema = z.object({
  status: z.string(),
  description: z.string(),
});

export const updateUserResponseSchema = updateAdminResponseSchema.extend({ adminId: z.string() });

export type adminBillInputType = z.infer<typeof updateAdminSchema>;
export type userBillInputType = z.infer<typeof updateUserSchema>;
