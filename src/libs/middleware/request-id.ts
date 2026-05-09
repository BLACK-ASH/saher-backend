import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.headers['x-request-id']?.toString() || randomUUID();

  req.id = id;
  res.setHeader('x-request-id', id);

  next();
};
