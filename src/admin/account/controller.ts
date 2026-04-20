import { NextFunction, Request, Response } from 'express';
import { AccountRegisterInput } from './schema.js';
import { User } from '../../database/user.model.js';
import { Account } from '../../database/account.model.js';
import mongoose from 'mongoose';
import { ApiError } from '../../libs/class/api-error.js';
import { onboardEmailTemplate } from '../../libs/mail/templates/onboard-mail.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';

export const accountRegisterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const registerInput: AccountRegisterInput = req.body;
  const session = await mongoose.startSession();

  const existingEmail = await User.findOne({ email: registerInput.user.email });
  if (existingEmail) throw new ApiError(400, 'User Already Exist.');

  const existingEmpId = await Account.findOne({
    employeeId: registerInput.account.employeeId,
  });
  if (existingEmpId) throw new ApiError(400, 'User With Same Employee Id Exist.');

  try {
    const user = await session.withTransaction(async () => {
      const user = new User(registerInput.user);
      await user.save({ session });

      const account = new Account({
        user: user._id,
        ...registerInput.account,
      });

      await account.save({ session });
      return user;
    });

    // ❗ Ensure user exists after transaction
    if (!user) {
      return next(new ApiError(500, 'User creation failed.'));
    }

    // ✅ Send email AFTER transaction success
    const html = onboardEmailTemplate({
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Saher Internal',
      html,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      data: user._id,
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};
export const accountUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const updateInput = req.body;

  const update = await Account.findByIdAndUpdate(id, updateInput);
  if (!update) throw new ApiError(404, 'Employee Not Found.');

  return res.status(200).json({
    success: true,
    message: 'Employee update successfully.',
    data: null,
  });
};

export const accountGetController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const account = await Account.findById(id);
  if (!account) throw new ApiError(404, 'User Not Found.');

  return res.status(200).json({
    success: true,
    message: 'Employee get successfully.',
    data: account,
  });
};
