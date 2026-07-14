import { Types } from 'mongoose';
import z from 'zod';

export const objectId = (error: string = 'Invalid Object Id.') =>
  z
    .string()
    .trim()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: error,
    });

export const imageType = z.object({ id: z.string(), alt: z.string(), src: z.string() });

export const optionalText = () =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  );

export const optionalAlphaText = () =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z
      .string()
      .regex(/^[A-Za-z\s]+$/, 'Must contain only letters')
      .transform((v) => v.toUpperCase())
      .optional(),
  );

export const optionalField = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );
