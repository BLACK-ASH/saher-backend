import { Types } from 'mongoose';
import z from 'zod';

export const objectId = (error: string = 'Invalid Object Id.') =>
  z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: error,
  });
