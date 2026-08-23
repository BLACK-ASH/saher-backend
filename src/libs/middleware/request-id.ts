import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // Trust client-supplied id only if it's a safe token (log-injection/header-smuggling guard)
  const header = req.headers['x-request-id']?.toString() ?? '';
  const id = /^[\w-]{1,64}$/.test(header) ? header : randomUUID();

  req.id = id;
  res.setHeader('x-request-id', id);

  next();
};
