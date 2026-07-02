import type { Request, Response } from 'express';

import { handleSettleSchema } from './schema.js';
import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { User } from '../../database/user.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { auditLog } from '../../libs/utils/audit-log.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { notification } from '../../libs/utils/notification.js';

export const handleSettlementRequest = async (req: Request, res: Response) => {
  // Write a code to handle settlement request (complete settlement)
  // step 1: take the settlement bill id from params
  // // only admin can access this
  // // pass the deatil from body {mode and status}
  // // after the the settlement set till which admin have to collect his money (15 days)

  const { settleId } = req.params;
  const { mode, status, description } = req.body;
  const settleDate = new Date();

  const settleBill = await Settlement.findById(settleId);
  if (!settleBill) throw new ApiError(400, 'Settlement bill not found');

  if (settleBill.expiredAt === null || settleBill.expiredAt === undefined)
    throw new ApiError(400, 'expired not found');

  if (new Date() > settleBill.expiredAt) {
    settleBill.status = 'expired';
    settleBill.description = 'Settlement is Expired';
    await settleBill.save();
  }

  // if settlement date is expired
  if (settleBill.status === 'expired') {
    return ApiResponse.success(res, {
      message: 'Bill settlement date expired',
      data: null,
      statusCode: 201,
    });
  }

  // if settlement is already completed
  if (settleBill.status === 'settle') {
    return ApiResponse.success(res, {
      message: 'Settlement is Already completed',
      data: null,
      statusCode: 201,
    });
  }

  // if settlement is still pending
  if (settleBill.status === 'pending' || settleBill.status === 'on-hold') {
    // If the status is enter as Pending or On-Hold then mode cannot be change
    if (status === 'pending' || (status === 'on-hold' && mode !== '-')) {
      return ApiResponse.success(res, {
        message: 'you have to change the status from "pending" or "on-hold" to change the mode',
        data: null,
        statusCode: 201,
      });
    }

    settleBill.mode = mode;
    settleBill.status = status;
    settleBill.settleDate = settleDate;
    settleBill.description = description;
    await settleBill.save();

    const action = {
      type: 'none' as const,
      label: 'handle-bill',
      url: '',
      method: 'POST' as const,
    };

    const notificationDesc = `bill of amount ${settleBill.amount} is completed `;
    const notificationTitle = 'settlement bill Completed';

    await notification.specific.info(
      [settleBill.user.toString()],
      notificationTitle,
      notificationDesc,
      action,
    );

    const employee = await User.findById(settleBill.user);
    const bill = await Bill.findById(settleBill.bill);
    if (!bill) throw new ApiError(400, 'Bill not Found');

    const from = bill.advance === 0 ? 'saher' : employee?.displayName;
    const to = bill.advance === 0 ? employee?.displayName : 'saher';
    await auditLog(
      settleBill.date,
      bill?.description,
      settleBill.amount,
      String(from),
      String(to),
      settleBill.status,
    );
  }

  const normalized = normalizeDoc(settleBill.toJSON());
  const parsed = handleSettleSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill settlement completed',
    data: parsed,
    statusCode: 201,
  });
};
