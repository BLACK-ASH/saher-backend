import type { Request, Response } from 'express';

import { getBillResponseSchema } from './get-bill.schema.js';
import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// For employee,admin and manager
export const myBillsController = async (req: Request, res: Response) => {
  // Write a code to get all the bills that created by user
  // step 1: take the user from req.user
  // step 2: In database find all the bill created by this user:
  // // check that bills user === req.user
  // // if any bill is find than display them
  // // else pass a message that no bill is found created by you

  const userId = req.user?.id;
  if (!userId) throw new ApiError(400, 'Forbidden: user required');

  const key = createKey('reimbursement', 'mybill', userId.toString());
  const data = await getCache(key);

  if (data) {
    return ApiResponse.success(res, {
      message: 'Bills of the user',
      data: data,
      statusCode: 201,
    });
  }

  const bills = await Bill.find({ user: userId, isDeleted: false }).lean();
  if (!bills) throw new ApiError(400, 'Bill not found');

  const normalized = normalizeDoc(bills);
  const parsed = getBillResponseSchema.array().parse(normalized);

  await setCache(key, parsed, 7200);

  return ApiResponse.success(res, {
    message: 'Bills of the user',
    data: parsed,
    statusCode: 201,
  });
};
