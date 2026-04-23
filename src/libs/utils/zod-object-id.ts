import { Types } from 'mongoose';
import z from 'zod';

export const objectId = (error: string = 'Invalid Object Id.') =>
  z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: error,
  });

export const imageType = z.object({ id: z.string(), alt: z.string(), src: z.string() });
