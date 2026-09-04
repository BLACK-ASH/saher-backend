import type { Request, Response } from 'express';

import { searchBillQuerySchema, getBillResponseSchema } from './get-bill.schema.js';
import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, getCache, setCache } from '../../libs/redis/redis-utils.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// For employee,admin and manager
export const myBillsController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(400, 'Forbidden: user required');

  // Validate isDeleted query param (default false, aligns with events convention)
  const { isDeleted } = searchBillQuerySchema.pick({ isDeleted: true }).parse(req.query);

  // Cache only the default (active) view under the exact key every bill writer
  // invalidates — a per-flag key would silently break cache freshness (#bug class).
  const key = createKey('reimbursement', 'mybill', userId.toString());
  const data = await getCache(key);

  if (!isDeleted && data) {
    return ApiResponse.success(res, {
      message: 'Bills of the user',
      data: data,
      statusCode: 200,
    });
  }

  const bills = await Bill.find({ user: userId, isDeleted }).populate('images').lean();

  const normalized = normalizeDoc(bills);
  const parsed = getBillResponseSchema.array().parse(normalized);

  if (!isDeleted) {
    await setCache(key, parsed, 7200);
  }

  return ApiResponse.success(res, {
    message: 'Bills of the user',
    data: parsed,
    statusCode: 200,
  });
};
