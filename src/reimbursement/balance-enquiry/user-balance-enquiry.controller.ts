import type { Request, Response } from 'express';

import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const userBalanceEnquiryController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(400, 'User ID is required');

  // A bill's amount only counts once it is approved AND settled: at that point
  // amount - advance decides the direction — org pays the user when amount >
  // advance, the user pays the org back when advance > amount.
  const bills = await Bill.find({ user: userId, isDeleted: false, status: 'accept' })
    .select('advance amount')
    .lean();

  const settledBillIds = new Set(
    bills.length === 0
      ? []
      : (
          await Settlement.find({
            bill: { $in: bills.map((b) => b._id) },
            status: 'settle',
          })
            .select('bill')
            .lean()
        ).map((s) => String(s.bill)),
  );

  let advance = 0;
  let amount = 0;
  let settled = 0;
  for (const b of bills) {
    if (!settledBillIds.has(String(b._id))) continue;
    const diff = (b.amount ?? 0) - (b.advance ?? 0);
    advance += b.advance ?? 0;
    amount += b.amount ?? 0;
    settled += Math.abs(diff);
  }

  const net = amount - advance;
  const netOutstanding = Math.abs(net);
  const record = net >= 0 ? 'Amount to Received' : 'Amount to Paid';

  return ApiResponse.success(res, {
    message: 'User Balance Enquiry',
    data: {
      PocketUse: amount,
      AdvanceUse: advance,
      SettledUse: settled,
      Total: `${netOutstanding} ${record}`,
      ...(settledBillIds.size === 0 && { Empty: true }),
    },
    statusCode: 200,
  });
};
