import { Response } from 'express';
import { formatMessage } from '../utils/formatted-message.js';

type MetaType = Record<string, unknown>;

export class ApiResponse {
  static success<T>(
    res: Response,
    {
      message = 'Success',
      data,
      meta,
      statusCode = 200,
    }: {
      message?: string;
      data?: T;
      meta?: MetaType;
      statusCode?: number;
    },
  ) {
    return res.status(statusCode).json({
      success: true,
      message: formatMessage(message),
      data: data ?? null,
      ...(meta && { meta }), // ✅ only include if present
    });
  }

  static created<T>(
    res: Response,
    {
      message = 'Created successfully',
      data,
      meta,
    }: {
      message?: string;
      data?: T;
      meta?: MetaType;
    },
  ) {
    return res.status(201).json({
      success: true,
      message: formatMessage(message),
      data: data ?? null,
      ...(meta && { meta }),
    });
  }

  static noContent(res: Response) {
    return res.status(204).send(); // ✅ correct
  }
}
