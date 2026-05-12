import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { reviewResponseSchema } from './get-bill.schema.js';

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

  const userId = req.user?.id;
  const { billId } = req.params;
  const role = req.user?.role;

  const bill = await Bill.findById(billId).lean();
  if (!bill || bill.isDeleted === true) throw new ApiError(400, 'Bill not found');

  if (role === 'user') {
    if (bill.user.toString() !== userId) throw new ApiError(400, 'Unauthorized');
  }
  const normalized = normalizeDoc(bill);
  const parsed = reviewResponseSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill fetch successfully',
    data: parsed,
    statusCode: 201,
  });
};
