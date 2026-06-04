import type { Request, Response } from 'express';

import { billSchema, adminBillCreatSchema, adminBillUpdateSchema } from './schema.js';
import { Bill } from '../../database/bill.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { notificationService } from '../../libs/utils/notification.service.js';

export const adminCreateBill = async (req: Request, res: Response) => {
  // write a code to create a admin bill
  // step 1: take  {advance, date, reason} from req.body and user from req.user
  // step 2: create a bill and pass all of this
  // after that convert it into normalizedDoc and send notification to admin
  // adn pass the response

  const { user, advance, date, description } = req.body;

  const userExist = await User.findById(user);
  if (!userExist) throw new ApiError(400, 'user not found');

  const bill = await Bill.create({
    user,
    advance,
    description,
    date,
  });

  const normalized = normalizeDoc(bill.toObject());
  const parsed = adminBillCreatSchema.parse(normalized);

  const notificationDesc = `bill is of amount ${advance} is created`;
  const notificationTitle = 'New bill created';

  await notificationService.specific.success([user], notificationTitle, notificationDesc);

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
  const { advance, description } = req.body;

  if (!billId) throw new ApiError(400, 'BillId is required');

  const bill = await Bill.findById(billId);
  if (!bill || bill.isDeleted === true) throw new ApiError(400, 'Bill not found');

  // If Bill is accept
  if (bill.status === 'accept') {
    throw new ApiError(400, 'Bill is already accepted');
  }
  // If Bill is on-hold
  if (bill.status === 'reject') {
    throw new ApiError(400, 'Bill is already rejected');
  }
  // If bill is on pending
  if (bill.status === 'pending' || bill.status === 'on-hold') {
    bill.advance = advance;
    bill.description = description;
    await bill.save();
  }

  const normalized = normalizeDoc(bill.toJSON());
  const parsed = adminBillUpdateSchema.parse(normalized);

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

  if (bill.status === 'pending') {
    bill.isDeleted = true;
    bill.save();
  } else throw new ApiError(400, "you can't delete this bill now");

  return ApiResponse.success(res, {
    message: 'Move to trash',
    data: null,
    statusCode: 201,
  });
};
