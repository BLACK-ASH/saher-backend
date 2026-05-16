import type { Request, Response } from 'express';

import { billSchema, userBillCreateSchema } from './schema.js';
import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { sendSystemNotification } from '../../libs/utils/system-notification.js';

export const userCreateBill = async (req: Request, res: Response) => {
  // write a code to create a user bill
  // step 1: take  {amount,description,date,image} from req.body and user from req.user
  // step 2: create a bill and pass all of this
  // after that convert it into normalizedDoc and send notification to admin
  // adn pass the response

  const user = req.user;
  const { amount, description, date, images } = req.body;

  const bill = await Bill.create({
    user: user?.id,
    amount,
    description,
    date,
    images,
  });

  // const normalized = normalizeDoc(bill.toObject())
  // const parsed = userBillCreateSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill created successfully',
    data: null,
    statusCode: 201,
  });
};

export const userUpdateBill = async (req: Request, res: Response) => {
  // write a code to update a user bill
  // step 1: take the billId from params and user from req.user
  // step 2: check the following condition
  // // whether bill exist
  // // whether the bill.user is same as user
  // // whether the bills is pending or not

  const user = req.user;
  const { billId } = req.params;
  const { amount, description, images } = req.body;

  if (!billId) throw new ApiError(400, 'BillId is required');

  const bill = await Bill.findById(billId);
  if (!bill || bill.isDeleted === true) throw new ApiError(400, 'Bill not found');
  if (bill.user.toString() !== user?.id) throw new ApiError(400, 'Unauthorized');

  // If Bill is accept
  if (bill.status === 'accept') {
    throw new ApiError(400, 'Bill is already accepted');
  }
  // If Bill is on-hold
  if (bill.status === 'reject') {
    throw new ApiError(400, 'Bill is already rejected');
  }
  // If bill is on pending or on-hold
  if (bill.status === 'pending' || bill.status === 'on-hold') {
    if (bill.amount >= 0) {
      bill.description = description;
    } else {
      bill.description += `\n${description}`;
    }
    bill.amount = amount;
    bill.images = images;
    await bill.save();
  }

  return ApiResponse.success(res, {
    message: 'Bill updated successfully',
    data: null,
    statusCode: 201,
  });
};

export const userSoftDeleteBill = async (req: Request, res: Response) => {
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
  if (bill.user.toString() !== user?.id) throw new ApiError(400, 'Unauthorized');

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
