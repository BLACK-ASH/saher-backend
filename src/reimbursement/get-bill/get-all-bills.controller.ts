import type { Request, Response } from 'express';

import { getSettleBillResponsiveSchema } from './get-bill.schema.js';
import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// For admin and manager
export const getAllBillsController = async (req: Request, res: Response) => {
  // write a code to get all the bills in the database
  // step 1: take role from req.user
  // step 2: check whether the user role is admin or manager
  // // if it is then get all the bill from Bill
  // // if is not pass the error

  const user = req.user?.id;
  if (!user) throw new ApiError(400, 'Forbidden: user required');

  const key = createKey('reimbursement', 'bills', 'list', user.toString());
  const data = await getCache(key);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const count = await Settlement.countDocuments();

  if (data) {
    return ApiResponse.success(res, {
      message: 'All the bills',
      data: data,
      statusCode: 201,
      meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
    });
  }

  const allBills = await Settlement.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  if (allBills.length === 0) {
    return ApiResponse.success(res, {
      message: 'No bill to show',
      data: [],
      statusCode: 201,
    });
  }

  const normalized = normalizeDoc(allBills);
  const parsed = getSettleBillResponsiveSchema.array().parse(normalized);

  await setCache(key, parsed, 7200);

  return ApiResponse.success(res, {
    message: 'All the bills',
    data: parsed,
    statusCode: 201,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};
