import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { updateAdvanceBillResposeSchema } from './admin-bill.schema.js';

// Advance bill update
export const advanceUpdate = async (req: Request, res: Response) => {
  // write a code to update the bill
  // this is used to update a bill only when the status of the bill is pending
  // if the status is not pending could be accepted/rejected then the bill can not be edited

  // step 1: see whether the user is login by user=req.user?.id
  // step 2: take the user id of the bill that need to be updated :
  // // check whther the id is valid
  // // check the bill is of the same user
  // // check whether the status of bill pending then procced
  // // if the status is not pending then don't proceed further and pass message that bill can't be updated
  // // if the bill proceed then updated only (image,billadvance,description) only this is need to be edited

  const adminId = req.user?.id;
  const { billId } = req.params;

  if (!billId) throw new ApiError(400, 'Bill id id required');

  const bill = await Reimbursement.findById(billId);
  if (!bill) throw new ApiError(400, 'Bill not found');

  if (bill.adminId?.toString() !== adminId) throw new ApiError(400, 'Unauthorized');

  if (bill.status !== 'pending') throw new ApiError(400, "you can't update this bill now");

  const { user, advance, adminNote, image } = req.body;

  const update = await Reimbursement.findByIdAndUpdate(billId, { user, advance, adminNote, image });

  const normalized = normalizeDoc(update);
  const parsed = updateAdvanceBillResposeSchema.parse(normalized);

  return ApiResponse.success(res, {
    message: 'bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};
