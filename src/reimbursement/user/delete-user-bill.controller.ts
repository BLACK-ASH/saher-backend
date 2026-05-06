import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

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

  return ApiResponse.success(res, {
    message: 'bill deleted successfully',
    data: null,
    statusCode: 201,
  });
};
