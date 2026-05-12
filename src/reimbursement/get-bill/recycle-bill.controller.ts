import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { reviewResponseSchema } from './get-bill.schema.js';

// Get all the soft Deleted bills
export const recycleBillsController = async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role === 'user') throw new ApiError(400, 'Unauthorized');

  const recycles = await Bill.find({ isDeleted: true }).lean();
  if (recycles.length === 0) throw new ApiError(200, 'No bills to show');

  const normalized = normalizeDoc(recycles);
  const parsed = reviewResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Deleted bills',
    data: parsed,
    statusCode: 201,
  });
};
