import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { Media } from '../../database/media-upload.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { billResponseSchema } from './user-bill.schema.js';
import { sendSystemNotification } from '../../libs/utils/system-notification.js';
import { User } from '../../database/user.model.js';

// Create bill
export const createBill = async (req: Request, res: Response) => {
  // write a code create a bill
  // to create a bill we need {
  // userId: req.body
  // image: upload a bill img
  // amount: the amount to be paid
  // paymentDate: date at which payment occured
  // description: description by the user
  // }

  const { amount, description, image, dateOfPayment } = req.body;
  const userId = req.user?.id;
  // const user = req.user;

  if (!userId) throw new ApiError(401, 'User not found');

  const bill = await Reimbursement.create({
    user: userId,
    image,
    amount,
    dateOfPayment,
    description,
    createdBy: userId,
  });

  const normalized = normalizeDoc(bill);
  const parsed = billResponseSchema.parse(normalized);

  const users = await User.find({ role: { $in: ['admin', 'manager'] } }).select('_id');

  // Send notification to all admin/manager
  await Promise.all(
    users.map((user) =>
      sendSystemNotification({
        user: user._id.toString(),
        type: 'Request',
        title: 'New bill submited',
        description: `A new bill of ₹${bill.amount} has been submitted`,
      }),
    ),
  );

  return ApiResponse.success(res, {
    message: 'bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};
