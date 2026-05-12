import { Request, Response } from 'express';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { handleSettleSchema } from './schema.js';
import { ApiResponse } from '../../libs/class/api-response.js';

export const handleSettlementRequest = async (req: Request, res: Response) => {
  // Write a code to handle settlement request (complete settlement)
  // step 1: take the settlement bill id from params
  // // only admin can access this
  // // pass the deatil from body {mode and status}
  // // after the the settlement set till which admin have to collect his money (15 days)

  const { settleId } = req.params;
  const { mode, status, settleDate } = req.body;

  const settleBill = await Settlement.findById(settleId);
  if (!settleBill) throw new ApiError(400, 'Settlement bill not found');

  if (settleBill.expiredAt === null || settleBill.expiredAt === undefined)
    throw new ApiError(400, 'expired not found');

  if (settleBill.date > settleBill.expiredAt) {
    settleBill.status = 'expired';
    await settleBill.save();
    return ApiResponse.success(res, {
      message: 'Bill settlement date expired',
      data: null,
      statusCode: 201,
    });
  }

  if (settleBill) {
    settleBill.mode = mode;
    settleBill.status = status;
    settleBill.settleDate = settleDate;
    await settleBill.save();
  }

  const normalized = normalizeDoc(settleBill.toJSON());
  const parsed = handleSettleSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill settlement completed',
    data: parsed,
    statusCode: 201,
  });
};
