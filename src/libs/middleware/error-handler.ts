import { Request, Response, NextFunction } from "express"
import { ApiError } from "../class/api-error.js"

export default function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(error)
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ success: false, message: error.message, data: null })
  }
  if (error instanceof Error) {
    return res.status(500).json({ success: false, message: error.message, data: null })
  }
  return res.status(500).json({ success: false, message: "Internal Server Error.", data: null })
}
