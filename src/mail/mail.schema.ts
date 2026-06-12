import z from 'zod';

export const sendMailSchema = z.object({
  to: z.array(z.string()).min(1, 'At least one recipient is required'),

  cc: z.array(z.string()).default([]),

  bcc: z.array(z.string()).default([]),

  subject: z.string().trim().min(1, 'Subject is required').max(255),

  body: z.string().trim().min(1, 'Body is required'),
});

export const InBoxMailSchema = z.object({
  id: z.string(),
  from: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    image: z.object({
      id: z.string(),
      src: z.string(),
    }),
  }),

  to: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      image: z.object({
        id: z.string(),
        src: z.string(),
      }),
    }),
  ),

  recipientType: z.enum(['TO', 'CC', 'BCC']),
  subject: z.string(),
  body: z.string(),
});

export const OutBoxMailSchema = z.object({
  id: z.string(),
  from: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    image: z.object({
      id: z.string(),
      src: z.string(),
    }),
  }),

  to: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      image: z.object({
        id: z.string(),
        src: z.string(),
      }),
    }),
  ),

  recipientType: z.enum(['TO', 'CC', 'BCC']),
  subject: z.string(),
  body: z.string(),
});
export type SendMailInput = z.infer<typeof sendMailSchema>;
