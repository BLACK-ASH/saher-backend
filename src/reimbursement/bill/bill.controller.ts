import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Reimbursement } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { isPastDate } from '../../libs/utils/check-date.js';
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
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const bill = await Reimbursement.create({
    user: userId,
    billImg,
    billAmount,
    dateOfPayment,
    description,
  });
  return res.status(201).json({
    success: true,
    message: 'bill created successfully',
    data: bill,
  });
};
