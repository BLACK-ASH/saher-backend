import crypto from 'crypto';

import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import type { AccountRegisterInput } from './schema.js';
import { hashToken } from '../../auth/_utils/token.js';
import { Account } from '../../database/account.model.js';
import { Bank } from '../../database/bank.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { logger } from '../../libs/logger/logger.js';
import { sendEmail } from '../../libs/mail/resend-send-mail.js';
import { onboardEmailTemplate } from '../../libs/mail/templates/onboard-mail.js';
import { createKey, deleteCache, setCache } from '../../libs/redis/redis-utils.js';
import { getAccount, getAccountByUser } from '../_services/account.js';

export const accountRegisterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const registerInput = req.body as AccountRegisterInput;
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

      const bank = new Bank(registerInput.bank);
      await bank.save({ session });

      const account = new Account({
        user: user._id,
        bank: bank._id,
        ...registerInput.account,
      });

      await account.save({ session });
      return user;
    });

    // ❗ Ensure user exists after transaction
    if (!user) {
      return next(new ApiError(500, 'User creation failed.'));
    }

    // ✅ Send email AFTER transaction success; an email outage must not fail onboarding
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyUrl = process.env.BASE_URL + '/verify-email?token=' + verifyToken;
    await setCache(createKey('email-verification', hashToken(verifyToken)), user._id.toString(), 900);

    const html = onboardEmailTemplate({
      name: user.displayName || user.name,
      email: user.email,
      role: user.role,
      verifyUrl,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Saher Internal',
        html,
      });
    } catch (error) {
      logger.error({ err: error }, 'Onboard email failed');
    }

    const key = createKey('users', 'list');
    await deleteCache(key);
    return ApiResponse.created(res, { message: 'Employee registered.', data: user._id });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

export const accountUpdateController = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updateInput = req.body;

  const update = await Account.findByIdAndUpdate(id, updateInput);
  if (!update) throw new ApiError(404, 'Employee Not Found.');

  // account reads are cached by account id AND by user id — invalidate both
  const key = createKey('account', id);
  const key1 = createKey('account', 'userId', String(update.user));

  await Promise.all([deleteCache(key), deleteCache(key1)]);

  return ApiResponse.success(res, { message: 'Employee updated.' });
};

export const accountGetController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  let user;
  if (id === 'me') {
    const userId = req.user?.id as string;

    user = await getAccountByUser(userId);
    if (!user) throw new ApiError(404, 'User Not Found.');

    return ApiResponse.success(res, {
      message: 'Employee get successfully.',
      data: user,
      statusCode: 200,
    });
  }

  // Non-admins may only read their own record (KYC data rides on populates)
  if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    throw new ApiError(403, 'Forbidden.');
  }

  const account = await getAccount(id);
  if (!account) throw new ApiError(404, 'User Not Found.');

  return ApiResponse.success(res, {
    message: 'Employee get successfully.',
    data: account,
    statusCode: 200,
  });
};
