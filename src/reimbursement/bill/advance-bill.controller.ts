import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { Media } from '../../database/media-upload.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import {
  advanceBillResponseSchema,
  updateAdvanceBillResposeSchema,
  updateUserResponseSchema,
} from './advance-bill.schema.js';
import { sendSystemNotification } from '../../libs/utils/system-notification.js';

export const advanceBill = async (req: Request, res: Response) => {
  // write a code to give advance to employee
  // In this case we have to give advance to particular employee

  // step 1: from req body: {
  // userId: req.body
  // billImg: upload a bill img
  // amount: the amount to be paid
  // paymentDate: date at which payment occured
  // description: description by the user
  // }

  const { userId } = req.params;
  const { amount, adminNote, image, dateOfPayment } = req.body;
  const adminId = req.user?.id;

  if (!adminId) throw new ApiError(401, 'Unauthorized');
  if (!userId) throw new ApiError(401, 'User id is required');

  const media = await Media.findById(image);
  if (!media) throw new ApiError(401, 'images not exist');

  const bill = await Reimbursement.create({
    user: userId,
    image,
    adminId,
    amount,
    dateOfPayment,
    adminNote,
    givenBy: adminId,
  });

  const normalized = normalizeDoc(bill);
  // @ts-expect-error - _doc will exist
  const parsed = advanceBillResponseSchema.parse(normalized._doc);

  await sendSystemNotification({
    user: userId,
    type: 'Request',
    title: 'New bill submited',
    description: `A new bill of ₹${bill.amount} has been submitted`,
  });

  return ApiResponse.success(res, {
    message: 'bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};

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
  // // if the bill proceed then updated only (image,billAmount,description) only this is need to be edited

  const adminId = req.user?.id;
  const role = req.user?.role;
  const { billId } = req.params;

  if (!billId) throw new ApiError(400, 'Bill id id required');
  let update = null,
    parsed = null;
  const bill = await Reimbursement.findById(billId);
  if (!bill) throw new ApiError(400, 'Bill not found');

  if (role === 'admin' || role === 'manager') {
    if (bill.adminId?.toString() !== adminId) throw new ApiError(400, 'Unauthorized');

    if (bill.status !== 'pending') throw new ApiError(400, "you can't update this bill now");

    // const { userId } = req.params;
    const { amount, adminNote, image } = req.body;

    const media = await Media.findById(image);
    if (!media) throw new ApiError(400, 'Media not exist');

    update = await Reimbursement.findByIdAndUpdate(billId, { amount, adminNote, image });

    const normalized = normalizeDoc(update);
    // @ts-expect-error - _doc will exist
    parsed = updateAdvanceBillResposeSchema.parse(normalized._doc);
  } else if (role === 'user') {
    const { status, description } = req.body;

    update = await Reimbursement.findByIdAndUpdate(billId, { status, description });

    const normalized = normalizeDoc(update);
    // @ts-expect-error - _doc will exist
    parsed = updateUserResponseSchema.parse(normalized._doc);
  }
  if (!update) throw new ApiError(400, 'Update is empty');

  return ApiResponse.success(res, {
    message: 'bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};

// Advance bil delete
export const advanceSoftDelete = async (req: Request, res: Response) => {
  // write a code to delete an bill
  // we have to delete only when the status is pending

  // step 1: take userId form req.user.id and bill id from billId from params
  // step 2: after taking billId check the following conditions:
  // // check if the exist or not
  // // check whether the userId and bill.user.id are same
  // // check if the status are pending
  // // if all of this are codition is valid then only bill will be deleted
  // // else throw error

  const adminId = req.user?.id;
  const { billId } = req.params;
  if (!billId) throw new ApiError(400, 'Bill id is required');

  const bill = await Reimbursement.findById(billId);
  if (!bill) throw new ApiError(400, 'bill not found');

  if (bill.adminId?.toString() !== adminId) throw new ApiError(400, 'Unauthorized');

  if (bill.status !== 'pending') throw new ApiError(400, "you can't delete this bill now");

  bill.isDeleted = true;
  bill.save();

  return ApiResponse.success(res, {
    message: 'Bill deleted successfully',
    data: null,
    statusCode: 201,
  });
};
