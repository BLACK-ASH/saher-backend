import z from 'zod';

import { DOMPurify } from '../libs/utils/dompurify.js';

export const sendMailSchema = z.object({
  to: z.array(z.string()).min(1, 'At least one recipient is required'),

  cc: z.array(z.string()).default([]),

  bcc: z.array(z.string()).default([]),

  subject: z.string().trim().min(1, 'Subject is required').max(255),

  // Sanitize rich text at ingest — stored-XSS vector (bodies render as HTML downstream)
  body: z
    .string()
    .trim()
    .min(1, 'Body is required')
    .transform((value) => DOMPurify.sanitize(value)),
});

// Shared list pagination for inbox/outbox — bounded so aggregates can't return unbounded docs
export const mailListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const MailUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  image: z.object({
    id: z.string(),
    src: z.string(),
    alt: z.string(),
  }),
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
export type MailT = z.infer<typeof OutBoxMailSchema>;
