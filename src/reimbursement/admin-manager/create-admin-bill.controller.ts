import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { advanceBillResponseSchema } from './admin-bill.schema.js';
import { sendSystemNotification } from '../../libs/utils/system-notification.js';

export const advanceBill = async (req: Request, res: Response) => {
  // write a code to give advance to employee
  // In this case we have to give advance to particular employee

  // step 1: from req body: {
  // userId: req.body
  // billImg: upload a bill img
  // advance: the advance to be paid
  // paymentDate: date at which payment occured
  // description: description by the user
  // }

  const { userId } = req.params;
  const { advance, adminNote, image, dateOfPayment } = req.body;
  const adminId = req.user?.id;

  if (!adminId) throw new ApiError(401, 'Unauthorized');
  if (!userId) throw new ApiError(401, 'User id is required');

  const bill = await Reimbursement.create({
    user: userId,
    image,
    adminId,
    advance,
    dateOfPayment,
    adminNote,
    createdBy: adminId,
  });

  const normalized = normalizeDoc(bill);
  const parsed = advanceBillResponseSchema.parse(normalized);

  await sendSystemNotification({
    user: userId,
    type: 'Request',
    title: 'New bill submited',
    description: `A new bill of ₹${bill.advance} has been submitted`,
  });

  return ApiResponse.success(res, {
    message: 'bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};
