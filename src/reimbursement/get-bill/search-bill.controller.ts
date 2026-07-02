import type { Request, Response } from 'express';

import { getBillResponsiveSchema, getSettleBillResponsiveSchema } from './get-bill.schema.js';
import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';

export const searchBillController = async (req: Request, res: Response) => {
  const { description, amount, date, user } = req.query;

  if (!description && !amount && !date && !user)
    throw new ApiError(400, 'Please provide search parameter.');

  const query: any = {};

  if (description) {
    query.description = { $regex: new RegExp(description as string, 'i') };
  }
  if (amount) {
    query.amount = Number(amount);
  }
  if (user) {
    query.user = user;
  }

  if (date) {
    const startDate = new Date(date as string);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(startDate);
    end.setHours(23, 59, 59, 999);

    query.date = {
      $gte: start,
      $lte: end,
    };
  }

  const bills = await Bill.find(query).sort({ createdAt: -1 }).limit(5).lean();

  if (bills.length === 0) {
    return ApiResponse.success(res, {
      message: 'Bill not found',
      data: [],
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(bills);
  const parsed = getBillResponsiveSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Bill fetched succesfully',
    data: parsed,
    statusCode: 200,
  });
};

export const searchSettleBillController = async (req: Request, res: Response) => {
  // Finding settlement from user id

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const count = await Settlement.countDocuments();

  const Settlebills = await Settlement.find({ user: req.params.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (Settlebills.length === 0) {
    return ApiResponse.success(res, {
      message: 'Bill not found',
      data: [],
      statusCode: 200,
    });
  }

  const normalized = normalizeDoc(Settlebills);
  const parsed = getSettleBillResponsiveSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Settlement Bill fetched succesfully',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};
