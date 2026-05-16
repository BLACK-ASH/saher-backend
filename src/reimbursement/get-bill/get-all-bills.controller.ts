import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { getBillSchema } from './get-bill.schema.js';

// For admin and manager
export const getAllBillsController = async (req: Request, res: Response) => {
  // write a code to get all the bills in the database
  // step 1: take role from req.user
  // step 2: check whether the user role is admin or manager
  // // if it is then get all the bill from Bill
  // // if is not pass the error

  const allBills = await Bill.find({ isDeleted: false }).lean();

  if (allBills.length === 0) {
    return ApiResponse.success(res, {
      message: 'No bill to show',
      data: null,
      statusCode: 201,
    });
  }

  const normalized = normalizeDoc(allBills);
  const parsed = getBillSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'All the bills in Bill',
    data: parsed,
    statusCode: 201,
  });
};
