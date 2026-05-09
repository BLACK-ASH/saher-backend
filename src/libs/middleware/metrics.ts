import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../logger/metrics.js';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const route = req.originalUrl.split('?')[0];

    httpRequestTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode,
      },
      duration,
    );
  });

  next();
};
