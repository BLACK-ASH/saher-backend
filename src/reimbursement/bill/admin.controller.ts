import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { billSchema, adminBillCreatSchema } from './schema.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const adminCreateBill = async (req: Request, res: Response) => {
  // write a code to create a admin bill
  // step 1: take  {advance, date, reason} from req.body and user from req.user
  // step 2: create a bill and pass all of this
  // after that convert it into normalizedDoc and send notification to admin
  // adn pass the response

  const user = req.params.id as string;
  const { advance, date, reason } = req.body;

  const bill = await Bill.create({
    user,
    advance,
    amount: 0,
    reason,
    date,
  });

  const normalized = normalizeDoc(bill.toObject());
  const parsed = adminBillCreatSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};

export const adminUpdateBill = async (req: Request, res: Response) => {
  // write a code to update a user bill
  // step 1: take the billId from params and user from req.user
  // step 2: check the following condition
  // // whether bill exist
  // // whether the bill.user is same as user
  // // whether the bills is pending or not

  const user = req.user;
  const { billId } = req.params;
  const { amount, description, image } = req.body;

  if (!billId) throw new ApiError(400, 'BillId is required');

  const bill = await Bill.findById(billId);
  if (!bill || bill.isDeleted === true) throw new ApiError(400, 'Bill not found');
  if (bill.status !== 'pending') throw new ApiError(400, 'You can not update this bill now');

  const update = await Bill.findByIdAndUpdate(billId, { amount, description, image }).lean();
  if (!update) throw new ApiError(400, 'Update failed');

  const plain = JSON.parse(JSON.stringify(update));
  const parsed = billSchema.parse(plain);

  return ApiResponse.success(res, {
    message: 'Bill updated successfully',
    data: parsed,
    statusCode: 201,
  });
};

export const adminSoftDeleteBill = async (req: Request, res: Response) => {
  // write a code to soft delete a user bill
  // step 1: take the billId from params and user from req.user
  // step 2: check the following condition
  // // whether bill exist
  // // whether the bill.user is same as user
  // // whether the bills is pending or not

  const user = req.user;
  const { billId } = req.params;

  if (!billId) throw new ApiError(400, 'BillId is required');

  const bill = await Bill.findById(billId);
  if (!bill || bill.isDeleted === true) throw new ApiError(400, 'Bill not found');
  if (bill.status !== 'pending') throw new ApiError(400, 'You can not update this bill now');

  bill.isDeleted = true;
  bill.save();

  return ApiResponse.success(res, {
    message: 'Move to trash',
    data: null,
    statusCode: 201,
  });
};
