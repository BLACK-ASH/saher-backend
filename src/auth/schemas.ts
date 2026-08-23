import z from 'zod';

// 64-char hex — crypto.randomBytes(32).toString('hex')
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Invalid Token Format.');

export const changeEmailRequestSchema = z.object({
  email: z.email('New Email Address Is Required.'),
});

export const confirmTokenSchema = z.object({ token: tokenSchema });

export const confirmPasswordSchema = z.object({
  token: tokenSchema,
  password: z.string('Password Is Required.').min(8, 'Minimum Password Length Is 8.'),
});
