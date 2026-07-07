import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { notificationService } from '../../libs/utils/notification.service.js';

export const adminCreateBill = async (req: Request, res: Response) => {
  // write a code to create a admin bill
  // step 1: take  {advance, date, reason} from req.body and user from req.user
  // step 2: create a bill and pass all of this
  // after that convert it into normalizedDoc and send notification to admin
  // adn pass the response

  const { advance, date, description } = req.body;

  const userExist = await User.findById({ _id: req.params.user });
  if (!userExist) throw new ApiError(400, 'user not found');
  const user = userExist.id;

  await Bill.create({
    user,
    advance,
    description,
    date,
  });

  const action = {
    type: 'none' as const,
    label: 'create-bill',
    url: '',
    method: 'POST' as const,
  };

  const notificationDesc = `bill is of amount ${advance} is created`;
  const notificationTitle = 'New bill created';

  await notificationService.specific.info([user], notificationTitle, notificationDesc, action);

  return ApiResponse.success(res, {
    message: 'Bill created successfully',
    data: null,
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

  const { billId } = req.params;
  const { advance, description } = req.body;

  if (!billId) throw new ApiError(400, 'BillId is required');

  const bill = await Bill.findById(billId);
  if (!bill || bill.isDeleted === true) throw new ApiError(400, 'Bill not found');

  // If Bill is accept
  if (bill.status === 'accept') {
    return ApiResponse.success(res, {
      message: 'Bill is Already Accepted',
      data: null,
      statusCode: 201,
    });
  }
  // If Bill is on-hold
  if (bill.status === 'reject') {
    return ApiResponse.success(res, {
      message: 'Bill is Already Rejected',
      data: null,
      statusCode: 201,
    });
  }
  // If bill is on pending or on-hold
  if (bill.status === 'pending' || bill.status === 'on-hold') {
    bill.advance = advance;
    bill.description = description;
    await bill.save();
  }

  return ApiResponse.success(res, {
    message: 'Bill updated successfully',
    data: null,
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
