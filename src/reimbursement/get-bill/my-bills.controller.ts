import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { reviewResponseSchema } from './get-bill.schema.js';

// For employee,admin and manager
export const myBillsController = async (req: Request, res: Response) => {
  // Write a code to get all the bills that created by user
  // step 1: take the user from req.user
  // step 2: In database find all the bill created by this user:
  // // check that bills user === req.user
  // // if any bill is find than display them
  // // else pass a message that no bill is found created by you

  const userId = req.user?.id;

  // Using user because some userId exist even in admin bill so using user to ensure only the bills created by user will fetch
  const bills = await Bill.find({ user: userId }, { isDeleted: false }).lean();
  if (!bills) throw new ApiError(400, 'Bill not found');

  const normalized = normalizeDoc(bills);
  const parsed = reviewResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bills of the user',
    data: parsed,
    statusCode: 201,
  });
};
