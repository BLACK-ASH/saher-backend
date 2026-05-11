import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { reviewResponseSchema } from './reviewing-bill.schema.js';

// For employee,admin and manager
export const myBills = async (req: Request, res: Response) => {
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

// For employee, admin and manager
export const getBillById = async (req: Request, res: Response) => {
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

// For admin and manager
export const getAllBills = async (req: Request, res: Response) => {
  // write a code to get all the bills in the database
  // step 1: take role from req.user
  // step 2: check whether the user role is admin or manager
  // // if it is then get all the bill from Bill
  // // if is not pass the error

  const role = req.user?.role;
  const allBills = await Bill.find({ isDeleted: false }).lean();

  if (role === 'admin' || role === 'manager') {
    if (allBills.length === 0) throw new ApiError(400, 'No bill to show');
  } else {
    throw new ApiError(400, 'Unauthorized');
  }

  const normalized = normalizeDoc(allBills);
  const parsed = reviewResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'All the bills in Bill',
    data: parsed,
    statusCode: 201,
  });
};

// Get all the soft Deleted bills
export const recycleBills = async (req: Request, res: Response) => {
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
