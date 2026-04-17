import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../class/api-error.js';
import { formatMessage } from '../utils/formatted-message.js';

export default function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);
  if (error instanceof ApiError) {
    return res
      .status(error.statusCode)
      .json({ success: false, message: formatMessage(error.message), data: error.data });
  }
  if (error instanceof Error) {
    return res
      .status(500)
      .json({ success: false, message: formatMessage(error.message), data: null });
  }
  return res.status(500).json({ success: false, message: 'Internal Server Error.', data: null });
}
