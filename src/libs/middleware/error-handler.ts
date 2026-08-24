import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../class/api-error.js';
import { formatMessage } from '../utils/formatted-message.js';

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export default function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  const route = req.originalUrl.split('?')[0];

  // safe fallback logging first — req.log may be absent when httpLogger hasn't attached (tests, early errors)
  req.log?.error({
    type: 'error',
    service: 'backend',
    method: req.method,
    route,
    request_id: req.id,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });

  // API ERROR
  if (isApiError(error)) {
    return res.status(error.statusCode).json({
      success: false,
      message: formatMessage(error.message),
      error: error.data ?? null,
    });
  }

  // Multer body-limit breaches (uploads) — client mistake, not a server fault
  type MulterishError = Error & { code?: string; field?: string };
  const multerError = error as MulterishError;
  if (multerError?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File Too Large.',
      error: { field: multerError.field ?? null },
    });
  }

  // NORMAL ERROR — never leak internal messages (Mongoose/JWT/etc.) to clients
  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV !== 'production' ? formatMessage(error.message) : 'Internal Server Error.',
      error: null,
    });
  }

  // UNKNOWN ERROR
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error.',
    error: null,
  });
}
