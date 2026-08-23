import type { Request, Response } from 'express';

import { Payroll } from '../database/payroll.model.js';
import { ApiError } from '../libs/class/api-error.js';
import { ApiResponse } from '../libs/class/api-response.js';
import { normalizeDoc } from '../libs/utils/normailize-doc.js';

// Approve a payroll record before it can be paid
export const approvePayrollController = async (req: Request, res: Response) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new ApiError(400, 'Payroll not found');
  if (payroll.status === 'paid') throw new ApiError(400, 'Paid payroll cannot be re-approved');

  payroll.status = 'approved';
  await payroll.save();

  return ApiResponse.success(res, {
    message: 'Payroll approved successfully',
    data: normalizeDoc(payroll.toObject()),
    statusCode: 200,
  });
};
