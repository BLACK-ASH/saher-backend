import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { Media } from '../../database/media-upload.model.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { billResponseSchema, updateBillResposeSchema } from './create-bill.schema.js';

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

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const media = await Media.findById(image);
  if (!media) throw new ApiError(401, 'images not exist');

  const bill = await Reimbursement.create({
    user: userId,
    image,
    amount,
    dateOfPayment,
    description,
  });

  const normalized = normalizeDoc(bill);
  // @ts-expect-error - _doc will exist
  const parsed = billResponseSchema.parse(normalized._doc);

  return ApiResponse.success(res, {
    message: 'bill created successfully',
    data: parsed,
    statusCode: 201,
  });
};

// Update bill
export const updateBill = async (req: Request, res: Response) => {
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

  const userId = req.user?.id;
  const billId = req.params.id;

  if (!billId) throw new ApiError(401, 'Bill id is required');

  const bill = await Reimbursement.findById(billId);
  if (!bill) throw new ApiError(400, 'bill not exist');

  if (bill.user.toString() !== userId) throw new ApiError(400, 'Unauthorized');

  if (bill.status !== 'pending') throw new ApiError(400, "You can't delete this bill now");

  const { image, amount, description } = req.body;

  const media = await Media.findById(image);
  if (!media) throw new ApiError(401, 'images not exist');

  const update = await Reimbursement.findByIdAndUpdate(billId, { image, amount, description });

  const normalized = normalizeDoc(update);
  // @ts-expect-error - _doc will exist
  const parsed = updateBillResposeSchema.parse(normalized._doc);

  return ApiResponse.success(res, {
    message: 'bill updated successfully',
    data: parsed,
    statusCode: 201,
  });
};

// Delete bill
export const softDeleteBill = async (req: Request, res: Response) => {
  // write a code to delete an bill
  // we have to delete only when the status is pending

  // step 1: take userId form req.user.id and bill id from billId from params
  // step 2: after taking billId check the following conditions:
  // // check if the exist or not
  // // check whether the userId and bill.user.id are same
  // // check if the status are pending
  // // if all of this are then only bill will be deleted
  // // else throw error

  const userId = req.user?.id;
  const billId = req.params.id;

  if (!billId) throw new ApiError(401, 'Bill id is required');

  const bill = await Reimbursement.findById(billId);
  if (!bill) throw new ApiError(400, 'bill not exist');

  if (bill.user.toString() !== userId) throw new ApiError(400, 'Unauthorized');

  if (bill.status !== 'pending') throw new ApiError(400, "You can't update this bill now");

  bill.isDeleted = true;
  await bill.save();
  // await Reimbursement.findByIdAndDelete(billId, { bill })

  return ApiResponse.success(res, {
    message: 'bill deleted successfully',
    data: null,
    statusCode: 201,
  });
};
