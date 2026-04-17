import { Response, Request, NextFunction } from 'express';
import z from 'zod';
import { ApiError } from '../../libs/class/api-error.js';

// Schemas
// Register Schema
const bankRegisterSchema = z.object({
  accountHolderName: z.string(),
  bankName: z.string(),
  ifcs: z.string(),
  branch: z.string(),
  mobileNumber: z.string(),
});

// Update Schema
const bankUpdateSchema = bankRegisterSchema.partial();

// Types
export type bankRegisterType = z.infer<typeof bankRegisterSchema>;
export type bankUpdateType = z.infer<typeof bankUpdateSchema>;

// Validate Update Bank Register Schema
export const validateBankRegisterSchema = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const parsedBankRegisterInput = bankRegisterSchema.safeParse(req.body);

  const message = 'Invalid Input - ' + parsedBankRegisterInput.error?.issues[0].message;
  if (!parsedBankRegisterInput.success)
    throw new ApiError(400, message, parsedBankRegisterInput.error?.issues[0].message);

  req.body = parsedBankRegisterInput.data;
  next();
};

// Validate Update Bank Update Schema
export const validateBankUpdateSchema = async (req: Request, res: Response, next: NextFunction) => {
  const parsedBankUpdateInput = bankUpdateSchema.safeParse(req.body);

  const message = 'Invalid Input - ' + parsedBankUpdateInput.error?.issues[0].message;
  if (!parsedBankUpdateInput.success)
    throw new ApiError(400, message, parsedBankUpdateInput.error?.issues[0].message);

  req.body = parsedBankUpdateInput.data;
  next();
};
