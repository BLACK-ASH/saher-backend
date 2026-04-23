import z, { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../class/api-error.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const message = z.prettifyError(parsed.error);
      const data = z.flattenError(parsed.error);
      throw new ApiError(400, message, data);
    }

    req.body = parsed.data;
    next();
  };
};
export const validateAsync = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parsed = await schema.safeParseAsync(req.body);

    if (!parsed.success) {
      const message = z.prettifyError(parsed.error);
      const data = z.flattenError(parsed.error);
      throw new ApiError(400, message, data);
    }

    req.body = parsed.data;
    next();
  };
};
export const validateAsync = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parsed = await schema.safeParseAsync(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ');
      return next(new ApiError(400, message));
    }

    req.body = parsed.data; // ✅ transformed + validated data
    next();
  };
};
