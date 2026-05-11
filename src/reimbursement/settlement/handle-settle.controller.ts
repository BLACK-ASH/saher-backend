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
  const { mode, status } = req.body;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 15);

  const exist = await Settlement.findById(settleId).lean();
  if (!exist) throw new ApiError(400, 'Settlement bill not found');

  const settle = await Settlement.findByIdAndUpdate(
    settleId,
    {
      mode,
      status,
      date: new Date(),
      expiredAt,
    },
    { new: true },
  ).lean();

  if (!settle) throw new ApiError(400, 'Settlement bill not update');

  if (settle.expiredAt === null || settle.expiredAt === undefined)
    throw new ApiError(400, 'expired not found');
  if (new Date() > settle.expiredAt) {
    await Settlement.findByIdAndUpdate(settleId, { status: 'expired' }, { new: true });
  }

  const normalized = normalizeDoc(settle);
  const parsed = handleSettleSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill settlement completed',
    data: parsed,
    statusCode: 201,
  });
};
