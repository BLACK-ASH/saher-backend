import { NextFunction, Request, Response } from "express"
import { userSchema } from "../account/account.middleware.js"
import z from "zod"
import { hashPassword } from "../../libs/password-hash.js"


const userUpdateSchema = userSchema.partial()
export type UserUpdate = z.infer<typeof userSchema>

export const validateUserUpdate = async (req: Request, res: Response, next: NextFunction) => {
  if (req.body?.password) {
    req.body.password = await hashPassword(req.body.password)
  }
  const parsedUpdateInput = await userUpdateSchema.safeParseAsync(req.body)

  if (!parsedUpdateInput.success) {
    return res.status(400).json({ success: false, message: "Invalid Input", data: parsedUpdateInput.error.issues[0] })
  }

  req.body = parsedUpdateInput.data
  next()
}
