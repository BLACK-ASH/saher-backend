import { NextFunction, Request, Response } from 'express';
import { userSchema } from '../account/account.middleware.js';
import z from 'zod';
import { hashPassword } from '../../libs/utils/password-hash.js';
import { ApiError } from '../../libs/class/api-error.js';

<<<<<<< HEAD
<<<<<<< HEAD
const userUpdateSchema = userSchema.partial()
export type UserUpdate = z.infer<typeof userSchema>
=======
const userUpdateSchema = userSchema.partial();
export type UserUpdate = z.infer<typeof userSchema>;
>>>>>>> d72bcf44c4b8e201915ebe08181aea1ace4c2a52
=======
const userUpdateSchema = userSchema.partial();
export type UserUpdate = z.infer<typeof userSchema>;
>>>>>>> 88fef16bd2423037858c8d87e009abab481f82f3

export const validateUserUpdate = async (req: Request, res: Response, next: NextFunction) => {
  if (req.body?.password) {
    req.body.password = await hashPassword(req.body.password);
  }
  const parsedUpdateInput = await userUpdateSchema.safeParseAsync(req.body);

  const message = 'Invalid Input - ' + parsedUpdateInput.error?.issues[0].message;
  if (!parsedUpdateInput.success)
    throw new ApiError(400, message, parsedUpdateInput.error?.issues[0].message);

  req.body = parsedUpdateInput.data;
  next();
};
