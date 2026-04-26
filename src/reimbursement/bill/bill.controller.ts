import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { success } from 'zod';

export const createBill = async (req: Request, res: Response) => {
  // write a code create a bill
  // to create a bill we need {
  // userId: req.body
  // billImg: upload a bill img
  // amount: the amount to be paid
  // paymentDate: date at which payment occured
  // description: description by the user
  // }

  const { billAmount, description, billImg, dateOfPayment } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return ApiResponse.success(res, {
  message: 'Unauthorized',
  data: undefined,
  statusCode: 401
})
  }

  const bill = await Reimbursement.create({
    user: userId,
    billImg,
    billAmount,
    dateOfPayment,
    description,
  });
  return ApiResponse.success(res, {
  message: 'bill created successfully',
  data: bill,
  statusCode: 201
})
};
