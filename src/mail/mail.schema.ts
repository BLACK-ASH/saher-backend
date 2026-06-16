import z from 'zod';

export const sendMailSchema = z.object({
  to: z.array(z.string()).min(1, 'At least one recipient is required'),

  cc: z.array(z.string()).default([]),

  bcc: z.array(z.string()).default([]),

  subject: z.string().trim().min(1, 'Subject is required').max(255),

  body: z.string().trim().min(1, 'Body is required'),
});

const MailUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  image: z
    .object({
      id: z.string(),
      src: z.string(),
    })
    .nullable()
    .optional(),
});

export const InBoxMailSchema = z.object({
  id: z.string(),

  from: MailUserSchema,

  to: z.array(MailUserSchema),

  cc: z.array(MailUserSchema),

  subject: z.string(),

  body: z.string(),

  createdAt: z.coerce.date(),
});

export const OutBoxMailSchema = z.object({
  id: z.string(),

  from: MailUserSchema,

  to: z.array(MailUserSchema),

  cc: z.array(MailUserSchema),

  bcc: z.array(MailUserSchema),

  subject: z.string(),

  body: z.string(),

  createdAt: z.coerce.date(),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;
