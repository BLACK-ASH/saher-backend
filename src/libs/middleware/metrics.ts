import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../logger/metrics.js';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Route template (e.g. /user/:id), not raw URL — unbounded label cardinality OOMs prom-client
    const route = req.route?.path ?? req.baseUrl ?? 'unmatched';

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
