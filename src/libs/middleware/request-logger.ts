import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    req.log.info({
      type: 'request',
      method: req.method,
      route: req.originalUrl.split('?')[0],
      status: res.statusCode,
      duration_ms: duration,
      request_id: req.id,
      service: 'backend',
    });
  });

  next();
};
