import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { notification } from '../../libs/utils/notification.js';

export const handleBillController = async (req: Request, res: Response) => {
  // write a code to handle the bill settlement
  // step 1: for the settlement to be created the status of the is nedd to be accepted
  // // so first set whether you accept the bill or reject it
  // // take the status and reason from the bill and pass it

  const user = req.user;
  const billId = req.params.billId as string;
  const { status, reason } = req.body;
  if (!billId) throw new ApiError(400, 'Bill Id is required');

  const bill = await Bill.findById(billId);
  if (!bill || bill?.isDeleted === true) {
    return ApiResponse.success(res, {
      message: 'Bill not found',
      data: null,
      statusCode: 201,
    });
  }

  // find if the settlement of this bill is created or not
  const settlementExist = await Settlement.find({ bill: bill.id }).lean();
  if (settlementExist.length > 0) {
    return ApiResponse.success(res, {
      message: 'This Bill is Accepted and Settlement for this bill is already created',
      data: null,
      statusCode: 201,
    });
  }

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 15);

  const amount = bill.advance - bill.amount;
  let message;

  // pending/on-hold → transition to requested status; accept additionally mints a settlement
  if (bill.status === 'pending' || bill.status === 'on-hold') {
    if (status !== 'accept' && status !== 'reject' && status !== 'on-hold') {
      throw new ApiError(400, 'Invalid status transition');
    }
    bill.status = status;
    bill.reason = reason;
    await bill.save();
    if (status === 'reject') message = 'Bill has been rejected';
    if (status === 'on-hold') message = 'Bill has been put on hold';
  }
  if (bill.status === 'reject') {
    message = 'Bill is already rejected';
  }
  if (bill.status === 'accept') {
    await Settlement.create({
      bill: billId,
      user: bill.user,
      amount,
      mode: '-',
      date: new Date(),
      manager: user?.id,
      expiredAt,
    });

    const action = {
      type: 'none' as const,
      label: 'handle-bill',
      url: '',
      method: 'POST' as const,
    };

    const notificationDesc = `bill of amount ${amount} is created`;
    const notificationTitle = 'New settlement bill created';

    await notification.specific.info(
      [bill.user.toString()],
      notificationTitle,
      notificationDesc,
      action,
    );
    message = 'Bill Accepted and Settlement bill created successfully';
  }

  return ApiResponse.success(res, {
    message: message,
    data: null,
    statusCode: 201,
  });
};
