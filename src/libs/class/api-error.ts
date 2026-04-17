export class ApiError<T = unknown> extends Error {
  statusCode: number;
  isOperational: boolean;
<<<<<<< HEAD
<<<<<<< HEAD
  data: any

  constructor(statusCode = 500, message: string, data: any = null) {
=======
  data: T | null;

  constructor(statusCode = 500, message: string, data: T | null = null) {
>>>>>>> d72bcf44c4b8e201915ebe08181aea1ace4c2a52
=======
  data: T | null;

  constructor(statusCode = 500, message: string, data: T | null = null) {
>>>>>>> 88fef16bd2423037858c8d87e009abab481f82f3
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}
