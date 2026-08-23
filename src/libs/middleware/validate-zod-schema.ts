import z, { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../class/api-error.js';

// source defaults to body; pass 'query' for GET endpoints
export const validate = (schema: ZodSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      const message = z.prettifyError(parsed.error);
      const data = z.flattenError(parsed.error);
      throw new ApiError(400, message, data);
    }

    if (source === 'query') {
      Object.assign(req.query, parsed.data);
    } else {
      req.body = parsed.data;
    }
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
