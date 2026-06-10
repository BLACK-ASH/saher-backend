import z from 'zod';

export const LoginInputSchema = z.object({
  email: z.email('Email Is Required.'),
  password: z.string('Password Is Required.'),
});

export type LoginInputType = z.infer<typeof LoginInputSchema>;
