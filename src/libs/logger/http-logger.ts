import { randomUUID } from 'crypto';

import type { Request, Response } from 'express';
import pinoHttp from 'pino-http';

import { logger } from './logger.js';

type Req = Request & {
  id?: string;
};

type Res = Response;

// @ts-expect-error- it is present
export const httpLogger = pinoHttp({
  logger,

  genReqId: (req: Req) => {
    return req.headers['x-request-id']?.toString() || randomUUID();
  },

  customProps: (req: Req) => ({
    request_id: req.id,
  }),

  serializers: {
    req: (req: Req) => ({
      method: req.method,
      // strip query string — tokens in URLs must not reach logs
      url: req.originalUrl.split('?')[0],
    }),

    res: (res: Res) => ({
      statusCode: res.statusCode,
    }),
  },

  customLogLevel: (req: Req, res: Res, err?: Error) => {
    if (err) return 'error';
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
