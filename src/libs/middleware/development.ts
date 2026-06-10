import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../class/api-error.js';

const isProduction = process.env.NODE_ENV === 'production';

export const underDevelopment = (_req: Request, _res: Response, next: NextFunction) => {
  if (isProduction) {
    return next(new ApiError(503, 'This feature is currently under maintenance'));
  }

  next();
};
