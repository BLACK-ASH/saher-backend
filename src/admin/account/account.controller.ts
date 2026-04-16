import { Request, Response } from 'express';
import { AccountRegister } from './account.middleware.js';
import { User } from '../../database/user.model.js';
import { Account } from '../../database/account.model.js';
import mongoose from 'mongoose';
import { ApiError } from '../../libs/class/api-error.js';

export const accountRegisterController = async (req: Request, res: Response) => {
  const registerInput: AccountRegister = req.body;
  const session = await mongoose.startSession();

  let createdUser;

  try {
    const existingEmail = await User.findOne({ email: registerInput.user.email });
    if (existingEmail) {
      throw new ApiError(409, 'User with email already exists.');
    }

    const existingEmpId = await Account.findOne({
      employeeId: registerInput.account.employeeId,
    });
    if (existingEmpId) {
      throw new ApiError(409, 'User with Employee ID already exists.');
    }

    await session.withTransaction(async () => {
      // 1. Create User
      const user = await User.create([registerInput.user], { session });
      createdUser = user[0];

      // 2. Create Account
      const account = await Account.create(
        [
          {
            user: createdUser._id,
            ...registerInput.account,
          },
        ],
        { session },
      );

      if (!account.length) {
        throw new Error('Account creation failed.');
      }
    });

    // ✅ Send response AFTER transaction success
    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully.',
      // @ts-expect-error - is of type user
      data: createdUser?._id,
    });
  } finally {
    await session.endSession(); // ✅ always runs
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
