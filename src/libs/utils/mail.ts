import z from 'zod';

import { Mail } from '../../database/mail.model.js';

// type BulkmailOptions = z.ZodObject{
//   from: z.Strin;
//   to: ObjectId[];
//   bcc?: ObjectId[];
//   cc?: ObjectId[];
//   body: string;
//   subject: string;
// };

export const BulkMailOptions = z.object({
  from: z.string(),
  to: [z.string()],
  bcc: [z.string()],
  cc: [z.string()],
  body: z.string(),
  subject: z.string(),
});

export type BulkMailOptionT = z.infer<typeof BulkMailOptions>;

export const bulkMail = async ({ from, to, bcc = [], cc = [], body, subject }: BulkMailOptionT) => {
  const receivers = [...new Set(to.map((id) => id.toString()))];
  const mails = receivers.map((receiverId) => ({ from, to: receiverId, bcc, cc, subject, body }));

  return Mail.insertMany(mails);
};
