import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const userBalanceEnquiryController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(400, 'User ID is required');

  const bills = await Bill.find({ user: userId, isDeleted: false, status: 'accept' });
  if (bills.length === 0) {
    return ApiResponse.success(res, {
      message: 'There are NO bill data related to this user',
      data: [],
      statusCode: 200,
    });
  }

  let advance = 0;
  let amount = 0;
  bills.forEach((b) => {
    if (b.advance >= 0) {
      advance += b.advance ?? 0;
    }
    if (b.amount >= 0) {
      amount += b.amount ?? 0;
    }
  });

  const record = amount > advance ? ' Amount to Received' : ' Amount to Paid';

  return ApiResponse.success(res, {
    message: 'User Balance Enquiry',
    data: {
      PocketUse: amount,
      AdvanceUse: advance,
      Total: Math.abs(amount - advance) + record,
    },
    statusCode: 200,
  });
};
