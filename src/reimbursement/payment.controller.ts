import { Request, Response } from 'express';
import { ApiError } from '../libs/class/api-error.js';
import { Payment } from '../database/payment.model.js';
import { Reimbursement } from '../database/bill.model.js';
import {
  createPaymentSchema,
  paymentIdSchema,
  paymentUpdateSchema,
  createRecoverySchema,
} from './payment.schema.js';

export const createPaymentController = async (req: Request, res: Response) => {
  const user = req.user;

  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.message);
  }

  const { reimbursement, paidAmount, notes, billImg } = parsed.data;

  const existingPayment = await Payment.findOne({
    user: user?.id,
    reimbursement,
  });

  if (existingPayment) {
    throw new ApiError(400, 'Payment already exists for this reimbursement');
  }

  const payment = await Payment.create({
    user: user?.id,
    reimbursement,
    billImg,
    paidAmount,
    notes,
    advanceAmount: 0,
    pocketAmount: 0,
  });

  return res.status(201).json({
    success: true,
    message: 'Payment created successfully',
    data: payment,
  });
};

export const updatePaymentController = async (req: Request, res: Response) => {
  const paramParsed = paymentIdSchema.safeParse(req.params);
  if (!paramParsed.success) {
    throw new ApiError(400, paramParsed.error.message);
  }

  const bodyParsed = paymentUpdateSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    throw new ApiError(400, bodyParsed.error.message);
  }

  const { id } = paramParsed.data;
  const updateData = bodyParsed.data;

  const payment = await Payment.findByIdAndUpdate(id, updateData, { new: true });
  if (!payment) throw new ApiError(404, 'Payment not found');

  return res.status(200).json({
    success: true,
    message: 'Payment updated successfully',
    data: payment,
  });
};

export const getPaymentController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const payment = await Payment.findById(id).populate('user reimbursement billImg clearedBy');
  if (!payment) throw new ApiError(404, 'Payment not found.');

  return res.status(200).json({
    success: true,
    message: 'Payment retrieved successfully',
    data: payment,
  });
};

export const getMyPaymentsController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const payments = await Payment.find({ user: userId }).populate('reimbursement billImg').lean();

  if (payments.length === 0) {
    throw new ApiError(404, 'No payments found');
  }

  return res.status(200).json({
    success: true,
    message: 'Payments fetched successfully',
    data: payments,
  });
};

export const getAllPaymentsController = async (req: Request, res: Response) => {
  const role = req.user?.role;

  if (!['admin', 'manager'].includes(role!)) {
    throw new ApiError(403, 'Only admins and managers are permitted');
  }

  const payments = await Payment.find().populate('user reimbursement billImg clearedBy').lean();

  return res.status(200).json({
    success: true,
    message: 'All payments fetched successfully',
    data: payments,
  });
};

export const createPaymentRecoveryController = async (req: Request, res: Response) => {
  const adminUser = req.user;

  const parsedRecovery = createRecoverySchema.safeParse(req.body);
  if (!parsedRecovery.success) {
    throw new ApiError(400, parsedRecovery.error.message);
  }
  const { reimbursement: reimbursementId, recoveryAmount, notes } = parsedRecovery.data;

  const role = req.user!.role;

  if (!['admin', 'manager'].includes(role)) {
    throw new ApiError(403, 'Only admins and managers are permitted');
  }

  const originalReimbursement = await Reimbursement.findById(reimbursementId);
  if (!originalReimbursement) {
    throw new ApiError(404, 'Reimbursement not found');
  }

  const existingRecovery = await Payment.findOne({
    reimbursement: reimbursementId,
    requestType: 'ADMIN_RECOVERY',
  });
  if (existingRecovery) {
    throw new ApiError(400, 'Recovery already requested');
  }

  const recoveryPayment = await Payment.create({
    user: originalReimbursement.user,
    requestBy: adminUser?.id,
    requestType: 'ADMIN_RECOVERY',
    reimbursement: reimbursementId,
    billImg: originalReimbursement.billImg,
    paidAmount: recoveryAmount,
    recoveryAmount,
    notes: notes || 'Admin recovery - unused advance',
  });

  return res.status(201).json({
    success: true,
    message: 'Recovery request created successfully',
    data: recoveryPayment,
  });
};
