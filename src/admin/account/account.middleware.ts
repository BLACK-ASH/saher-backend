import { NextFunction, Request, Response } from "express";
import z from "zod";
import { hashPassword } from "../../libs/utils/password-hash.js";

export const userSchema = z.object({
  name: z.string().trim().min(2),
  displayName: z.string().optional(),
  image: z.string().optional(),
  role: z.enum(["user", "manager", "admin"]).default("user"),
  email: z.email(),
  password: z.string().optional(),
})

const accountSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.coerce.date(),
  dateOfJoining: z.coerce.date(),
  phoneNumber: z.string().trim(),
  secondaryPhoneNumber: z.string().optional(),
  employeeId: z.string(),
  department: z.string(),
  designation: z.string(),
  employeeType: z.enum(["full-time", "part-time", "volunteer"]),
  salaryStructure: z.string(),
  address: z.string(),
  bankDetail: z.string(),
  aadhar: z.string(),
  pan: z.string(),
  resume: z.string(),
})

const accountRegisterSchema = z.object({
  user: userSchema,
  account: accountSchema
})
  .transform(async (data) => {
    data.user.displayName = data.user.displayName ?? data.user.name
    const password = data.user.name.slice(0, 4) ?? data.account.dateOfBirth.getFullYear()
    data.user.password = await hashPassword(password)
    data.account.secondaryPhoneNumber = data.account.secondaryPhoneNumber ?? data.account.secondaryPhoneNumber

    return data;
  });

const accountUpdateSchema = accountSchema.partial()

export type AccountRegister = z.infer<typeof accountRegisterSchema>
export type AccountUpdate = z.infer<typeof accountUpdateSchema>

export const validateAccountRegister = async (req: Request, res: Response, next: NextFunction) => {
  const parsedRegisterInput = await accountRegisterSchema.safeParseAsync(req.body)

  if (!parsedRegisterInput.success) {
    return res.status(400).json({ success: false, message: "Invalid Input", data: parsedRegisterInput.error.issues[0] })
  }

  req.body = parsedRegisterInput.data
  next()
}

export const validateAccountUpdate =async (req: Request, res: Response, next: NextFunction) => {
  const parsedUpdateInput =await accountUpdateSchema.safeParseAsync(req.body)

  if (!parsedUpdateInput.success) {
    return res.status(400).json({ success: false, message: "Invalid Input", data: parsedUpdateInput.error.issues[0] })
  }

  req.body = parsedUpdateInput.data
  next()
}
