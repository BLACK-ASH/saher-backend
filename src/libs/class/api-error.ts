export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  data: any

  constructor(statusCode = 500, message: string, data: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data

    Error.captureStackTrace(this, this.constructor);
  }
}
