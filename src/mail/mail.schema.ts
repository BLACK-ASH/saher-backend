import z from 'zod';
import { objectId } from '../libs/utils/zod-object-id.js';

export const sendMailSchema = z.object({
  receiverID: z.array(objectId('Invalid Reciever User Id.')),
  subject: z.string().min(1).max(100),
  body: z.string().min(1).max(1000),
});
