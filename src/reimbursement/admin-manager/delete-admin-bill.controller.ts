import { Request, Response } from 'express';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';

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
