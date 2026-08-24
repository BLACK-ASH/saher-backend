import type { Request, Response } from 'express';

import { Account } from '../../database/account.model.js';
import { Bank } from '../../database/bank.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { getAccountByUser } from '../_services/account.js';
import { getBank } from '../_services/bank.js';

// Create Bank Controller
export const createBankDetailController = async (req: Request, res: Response) => {
  const { accountHolderName, bankName, accountNumber, ifcs, branch, mobileNumber } = req.body;

  const details = await Bank.create({
    accountHolderName,
    bankName,
    accountNumber,
    ifcs,
    branch,
    mobileNumber,
  });

  return ApiResponse.success(res, {
    message: 'Bank Details Added Successfull.',
    data: details,
    statusCode: 201,
  });
};

// Get Bank Controller
export const getBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  let user;
  if (id === 'me') {
    const userId = req.user?.id as string;
    user = await getAccountByUser(userId);
    if (!user) throw new ApiError(404, 'User Not Found.');
  }

  const bankId = user?.bank.id || id;

  // Non-admins may only read their own bank details
  if (!user && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    throw new ApiError(403, 'Forbidden.');
  }

  const details = await getBank(bankId);
  if (!details) throw new ApiError(400, 'Bank Details Not Exist.');

  return ApiResponse.success(res, {
    message: 'Bank Details Retrive Successfull.',
    data: details,
    statusCode: 200,
  });
};

// Update Bank Controller
export const updateBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;

  const updated = await Bank.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  if (!updated) throw new ApiError(404, 'Bank Details Nott Exist.');

  const key = createKey('bank', id);

  // account reads embed populated bank data — invalidate every account holding this bank
  const accounts = await Account.find({ bank: id }).select('_id user').lean();

  await Promise.all([
    deleteCache(key),
    ...accounts.flatMap((a) => [
      deleteCache(createKey('account', String(a._id))),
      deleteCache(createKey('account', 'userId', String(a.user))),
    ]),
  ]);

  return ApiResponse.success(res, {
    message: 'Bank Details Updated Successfull.',
    data: updated,
    statusCode: 200,
  });
};

// Delete Bank Controller (soft delete)
export const deleteBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const bank = await Bank.findById(id);
  if (!bank || bank.isDeleted) throw new ApiError(404, 'Bank Details Not Exist.');

  bank.isDeleted = true;
  await bank.save();

  const key = createKey('bank', id);
  const accounts = await Account.find({ bank: id }).select('_id user').lean();

  await Promise.all([
    deleteCache(key),
    ...accounts.flatMap((a) => [
      deleteCache(createKey('account', String(a._id))),
      deleteCache(createKey('account', 'userId', String(a.user))),
    ]),
  ]);

  return ApiResponse.success(res, {
    message: 'Bank Details Deleted Successfully',
    data: null,
    statusCode: 200,
  });
};

// Restore Bank Controller
export const restoreBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const bank = await Bank.findById(id);
  if (!bank || !bank.isDeleted) throw new ApiError(404, 'Deleted Bank Details Not Found.');

  bank.isDeleted = false;
  await bank.save();

  const key = createKey('bank', id);
  const accounts = await Account.find({ bank: id }).select('_id user').lean();

  await Promise.all([
    deleteCache(key),
    ...accounts.flatMap((a) => [
      deleteCache(createKey('account', String(a._id))),
      deleteCache(createKey('account', 'userId', String(a.user))),
    ]),
  ]);

  return ApiResponse.success(res, {
    message: 'Bank Details Restored Successfully',
    data: null,
    statusCode: 200,
  });
};
