import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../class/api-error.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ');
      throw new ApiError(400, message);
    }

    req.body = parsed.data; // ✅ clean data
    next();
  };
};
