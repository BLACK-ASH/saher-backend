import { NextFunction, Request, Response } from "express";
import z from "zod";


const registerSchema = z
  .object({
    name: z.string().trim().min(2),
    displayName: z.string().optional(),
    image:z.string().optional(),

    email: z.email(),
    password: z.string().optional(),

    role: z.enum(["user", "manager", "admin"]).default("user"),
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
  .transform((data) => {
    return {
      ...data,
      displayName: data.displayName ?? data.name,
      secondaryPhoneNumber:
        data.secondaryPhoneNumber ?? data.phoneNumber,
      password:
        data.password ??
        `${data.name.trim().slice(0, 4).toUpperCase()}${data.dateOfBirth.getFullYear()}`,
    };
  });

export type RegisterInputType = z.infer<typeof registerSchema>

export const validateRegisterInput = (req: Request, res: Response, next: NextFunction) => {
  const parsedRegisterInput = registerSchema.safeParse(req.body)

  if (!parsedRegisterInput.success) {
    return res.status(400).json({ message: parsedRegisterInput.error.issues[0] })
  }

  req.body = parsedRegisterInput.data
  next()
}
