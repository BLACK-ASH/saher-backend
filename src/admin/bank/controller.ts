import { Request, Response } from 'express';
import { Bank } from '../../database/bank.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { getBank } from '../_services/bank.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';
import { getAccountByUser } from '../_services/account.js';
import { ApiResponse } from '../../libs/class/api-response.js';

// Create Bank Controller
export const createBankDetailController = async (req: Request, res: Response) => {
  const { accountHolderName, bankName, ifcs, branch, mobileNumber } = req.body;

  const details = await Bank.create({
    accountHolderName,
    bankName,
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

  const updated = await Bank.findByIdAndUpdate(id, data);
  if (!updated) throw new ApiError(404, 'Bank Details Nott Exist.');

  const key = createKey('bank', id);
  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'Bank Details Updated Successfull.',
    data: updated,
    statusCode: 200,
  });
};

// Delete Bank Controller
export const deleteBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const deleted = await Bank.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Bank Details Not Exist.');

  const key = createKey('bank', id);
  await deleteCache(key);

  return ApiResponse.success(res, {
    message: 'Bank Details Deleted Succesfully',
    data: deleted,
    statusCode: 200,
  });
};
