import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { updateAdminResponseSchema } from './handle.schema.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const adminRequestHandler = async (req: Request, res: Response) => {
  // write a code to handle the admin request
  // step 1: first this request will accept by user only tah admin will decide to which user his sending
  // step 2: after creating an advance bill and req to user:
  // // check if the user in the bill and the current login are same
  // // the only thing an user can change is status and description
  // step 3: after the request is handled send the notification

  const { status, adminNote } = req.body;
  const { billId } = req.params;

  const bill = await Reimbursement.findById(billId);
  if (!bill) throw new ApiError(400, 'Bill not found');

  const update = await Reimbursement.findByIdAndUpdate(billId, { status, adminNote }).lean();

  const normalized = normalizeDoc(update);
  const parsed = updateAdminResponseSchema.parse(normalized);
  return ApiResponse.success(res, {
    message: 'Response send successfully',
    data: parsed,
    statusCode: 201,
  });
};
