import { Request, Response } from 'express';
import { Bank } from '../../database/bank.model.js';
import { ApiError } from '../../libs/class/api-error.js';

// Create Bank Controller
export const createBankDetailController = async (req: Request, res: Response) => {
  const { accountHolderName, bankName, ifcs, branch, mobileNumber } = req.body;

  const details = await Bank.create({
    accountHolderName,
    bankName,
    ifcs,
    branch,
    mobileNumber,
  });

  return res
    .status(201)
    .json({ success: true, message: 'Bank Details Added Successfull.', data: details });
};

// Get Bank Controller
export const getBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const details = await Bank.findById(id);
  if (!details) throw new ApiError(400, 'Bank Details Not Exist.');

  return res
    .status(200)
    .json({ success: true, message: 'Bank Details Retrive Successfull.', data: details });
};

// Update Bank Controller
export const updateBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  const updated = await Bank.findByIdAndUpdate(id, data);
  if (!updated) throw new ApiError(404, 'Bank Details Nott Exist.');

  return res
    .status(200)
    .json({ success: true, message: 'Bank Details Updated Successfull.', data: updated });
};

// Delete Bank Controller
export const deleteBankDetailController = async (req: Request, res: Response) => {
  const id = req.params.id;

  const deleted = await Bank.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Bank Details Not Exist.');

  return res
    .status(200)
    .json({ success: true, message: 'Bank Details Deleted Succesfully', data: deleted });
};
