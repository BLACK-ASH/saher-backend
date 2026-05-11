import { Request, Response } from 'express';
import { Bill } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { Settlement } from '../../database/settlement.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { settleSchema } from './schema.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const handleBill = async (req: Request, res: Response) => {
  // write a code to handle the bill settlement
  // step 1: for the settlement to be created the status of the is nedd to be accepted
  // // so first set whether you accept the bill or reject it
  // // take the status and reason from the bill and pass it

  const user = req.user;
  const { billId } = req.params;
  const { status, reason } = req.body;
  const bill = await Bill.findById(billId).lean();
  if (!bill || bill?.isDeleted === true) throw new ApiError(400, 'Bill not found');

  const updated = await Bill.findByIdAndUpdate(billId, { status, reason }, { new: true }).lean();
  if (!updated) throw new ApiError(400, 'Bill update failed');

  if (updated.advance === null || updated.advance === undefined)
    throw new ApiError(400, 'Advance not found');
  if (updated.amount === null || updated.amount === undefined)
    throw new ApiError(400, 'Amount not found');

  const amount = updated.advance - updated.amount;
  let parsed = null,
    message;

  if (updated.status === 'pending') {
    message = 'Bill is Still on pending';
  } else if (updated.status === 'rejected') {
    message = 'Bill is rejected';
  } else if (updated.status === 'accepted') {
    const createSettle = await Settlement.create({
      bill: billId,
      amount,
      mode: '-',
      date: new Date(),
      manager: user?.id,
    });

    const normalized = normalizeDoc(createSettle.toObject());
    parsed = settleSchema.parse(normalized);
    message = 'Settlement bill created successfully';
  }
  return ApiResponse.success(res, {
    message: message,
    data: parsed,
    statusCode: 201,
  });
};
