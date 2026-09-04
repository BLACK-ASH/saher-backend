import type { Request, Response } from 'express';

import { getBillResponseSchema } from './get-bill.schema.js';
import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

// Get all the soft Deleted bills
export const recycleBillsController = async (req: Request, res: Response) => {
  const recycles = await Bill.find({ isDeleted: true }).populate('images').lean();
  if (recycles.length === 0) throw new ApiError(200, 'No bills to show');

  const normalized = normalizeDoc(recycles);
  const parsed = getBillResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Deleted bills',
    data: parsed,
    statusCode: 201,
  });
};
