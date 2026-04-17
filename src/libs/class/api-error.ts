export class ApiError<T = unknown> extends Error {
  statusCode: number;
  isOperational: boolean;
  data: T | null;

  constructor(statusCode = 500, message: string, data: T | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}
