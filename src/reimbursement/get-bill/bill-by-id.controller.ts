import type { Request, Response } from 'express';

import { getSettleBillResponseSchema } from './get-bill.schema.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// For employee, admin and manager
export const getBillByIdController = async (req: Request, res: Response) => {
  // write a code to get bill by id
  // Here employee can find his bill by id but admin and manager can find every bill created by everyone in read format
  // step 1: take the user from req.user and billId from req.params
  // step 2: In database find bill of this id:
  // // check the role if it employee then find the bill created by employee only
  // // // if the bill is not there pass error
  // // if the role is admin or manager then find the bill
  // // // if the bill is not there pass error

  const { billId } = req.params;

  const key = createKey('reimbursement', 'bill', billId.toString());
  const data = await getCache(key);

  if (data) {
    return ApiResponse.success(res, {
      message: 'Bill fetch successfully',
      data: data,
      statusCode: 201,
    });
  }

  const bill = await Settlement.findById(billId).lean();
  if (!bill) {
    return ApiResponse.success(res, {
      message: 'Bill not found',
      data: null,
      statusCode: 201,
    });
  }
  const normalized = normalizeDoc(bill);
  const parsed = getSettleBillResponseSchema.parse(normalized);

  await setCache(key, parsed, 7200);

  return ApiResponse.success(res, {
    message: 'Bill fetch successfully',
    data: parsed,
    statusCode: 201,
  });
};
