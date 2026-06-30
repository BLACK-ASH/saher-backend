import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { notification } from '../../libs/utils/notification.js';
import { auditLog } from '../audit-log/audit-log.js';

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
  let message, data;

  if (bill.status === 'pending') {
    bill.status = status;
    bill.reason = reason;
    await bill.save();
  }
  if (bill.status === 'on-hold') {
    bill.status = status;
    bill.reason = reason;
    await bill.save();
  }
  if (bill.status === 'reject') {
    message = 'Bill is already rejected';
    data = null;
  }
  if (bill.status === 'accept') {
    const createSettle = await Settlement.create({
      bill: billId,
      amount,
      mode: '-',
      date: new Date(),
      manager: user?.id,
      expiredAt,
    });

    const employee = await User.findById(bill.user);
    if (bill.advance === 0) {
      const from = employee?.displayName;
      if (!from) throw new ApiError(400, 'user not found');
      await auditLog(
        createSettle.date,
        bill.description,
        createSettle.amount,
        from,
        'saher',
        createSettle.status,
      );
    } else {
      const to = employee?.displayName;
      if (!to) throw new ApiError(400, 'user not found');
      await auditLog(
        createSettle.date,
        bill.description,
        createSettle.amount,
        'saher',
        to,
        createSettle.status,
      );
    }

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
