import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const userBalanceEnquiryController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(400, 'User ID is required');

  const bills = await Bill.find({ user: userId, isDeleted: false, status: 'accept' });

  let advance = 0;
  let amount = 0;
  if (bills.length > 0) {
    for (const b of bills) {
      advance += b.advance ?? 0;
      amount += b.amount ?? 0;
    }
  }

  // money actually paid out via settled settlements nets against the outstanding total
  const settledDocs = await Settlement.find({ user: userId, status: 'settle' }).select('amount');
  const settled = settledDocs.reduce((acc, s) => acc + (s.amount ?? 0), 0);

  const netOutstanding = Math.abs(amount - advance - settled);
  const record = amount - advance >= 0 ? 'Amount to Received' : 'Amount to Paid';

  return ApiResponse.success(res, {
    message: 'User Balance Enquiry',
    data: {
      PocketUse: amount,
      AdvanceUse: advance,
      SettledUse: settled,
      Total: `${netOutstanding} ${record}`,
      ...(bills.length === 0 && { Empty: true }),
    },
    statusCode: 200,
  });
};
