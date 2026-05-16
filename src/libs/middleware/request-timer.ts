import { Request, Response, NextFunction } from 'express';

export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  req.startTime = Date.now();

  next();
};
