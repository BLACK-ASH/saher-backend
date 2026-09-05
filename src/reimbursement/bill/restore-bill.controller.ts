import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { createKey, deleteCache } from '../../libs/redis/redis-utils.js';

export const restoreBillController = async (req: Request, res: Response) => {
  const { billId } = req.params;

  if (!billId) throw new ApiError(400, 'BillId is required');

  const bill = await Bill.findById(billId);
  if (!bill || !bill.isDeleted) throw new ApiError(404, 'Deleted bill not found');

  bill.isDeleted = false;
  await bill.save();

  // mybills is cached per-user — restore makes the bill visible again
  await deleteCache(createKey('reimbursement', 'mybill', String(bill.user)));

  return ApiResponse.success(res, {
    message: 'Bill restored successfully',
    data: null,
    statusCode: 200,
  });
};