import { createHash, timingSafeEqual } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env.js';
import { ApiError } from '../class/api-error.js';

// Hash both sides so buffers are equal-length for timingSafeEqual and raw secret
// never sits in a comparable buffer.
const safeEqual = (a: string, b: string) => {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
};

// Cron trigger guard: secret travels in `Authorization: Bearer <CRON_SECRET>`
// (or `x-cron-secret`) — never in the URL path, which ends up in logs/history.
export const requireCronSecret = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : (req.header('x-cron-secret') ?? '');

  if (!token || !safeEqual(token, env.CRON_SECRET)) {
    throw new ApiError(401, 'Unauthorized');
  }

  next();
};
