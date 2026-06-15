import type { Request, Response } from 'express';

import { createSettleSchema, settleSchema } from './schema.js';
import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { notificationService } from '../../libs/utils/notification.service.js';
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

  if (bill) {
    bill.status = status;
    bill.reason = reason;
    await bill.save();
  }

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 15);

  const amount = bill.advance - bill.amount;
  let message, data;

  if (bill.status === 'pending') {
    message = 'Bill is Still on pending';
    data = null;
  }
  if (bill.status === 'on-hold') {
    message = 'Bill is has been put on on-hold';
    data = null;
  }
  if (bill.status === 'reject') {
    message = 'Bill is rejected';
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

    const normalized = normalizeDoc(createSettle.toObject());
    data = createSettleSchema.parse(normalized);
    message = 'Settlement bill created successfully';
  }

  const notificationDesc = `bill is of amount ${amount} is created`;
  const notificationTitle = 'New settlement bill created';

  await notificationService.specific.success(
    [bill.user.toString()],
    notificationTitle,
    notificationDesc,
  );

  return ApiResponse.success(res, {
    message: message,
    data: data,
    statusCode: 201,
  });
};
