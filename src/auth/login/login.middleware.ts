import { NextFunction, Request, Response } from "express";
import z from "zod";
import { ApiError } from "../../libs/class/api-error.js";

const LoginInputSchema = z.object({
  email: z.email(),
  password: z.string()
})

export type LoginInputType = z.infer<typeof LoginInputSchema>

export const validateLoginInput = (req: Request, res: Response, next: NextFunction) => {
  const parsedLoginInput = LoginInputSchema.safeParse(req.body)

  const message = "Invalid Input - " + parsedLoginInput.error?.issues[0].message
  if (!parsedLoginInput.success) throw new ApiError(400, message, parsedLoginInput.error?.issues[0].message)

  req.body = parsedLoginInput.data
  next()
}
