import type { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';

import { searchBillQuerySchema, getBillResponseSchema, getSettleBillResponseSchema } from './get-bill.schema.js';
import { Bill } from '../../database/bill.model.js';
import { Settlement } from '../../database/settlement.model.js';
import { ApiResponse } from '../../libs/class/api-response.js';
import { normalizeDoc } from '../../libs/utils/normailize-doc.js';
import { escapeRegex, buildKeywordOrConditions } from '../../libs/utils/keyword-filter.js';
import { istDayRange } from '../../libs/utils/date-time.js';

export const searchBillController = async (req: Request, res: Response) => {
  const queryParams = searchBillQuerySchema.parse(req.query);
  const { description, amount, user, status, date, isDeleted, page, limit } = queryParams;

  // No guard on empty searches: an empty filter set legitimately means "all
  // bills" (the UI's Status=All + User=All view).
  const query: QueryFilter<typeof Bill.schema.obj> = { isDeleted };

  if (description) {
    const orConditions = buildKeywordOrConditions(description, ['description']);
    query.$or = orConditions;
  }
  if (amount) {
    query.amount = amount;
  }
  if (user) {
    query.user = user;
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (date) {
    const [start, end] = istDayRange(date);
    query.date = {
      $gte: start,
      $lte: end,
    };
  }

  const skip = (page - 1) * limit;
  const [bills, count] = await Promise.all([
    Bill.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('images').lean(),
    Bill.countDocuments(query),
  ]);

  if (bills.length === 0) {
    return ApiResponse.success(res, {
      message: 'Bill not found',
      data: [],
      statusCode: 200,
      meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
    });
  }

  // join each bill's settlement status so the management table can show it
  const settlements = await Settlement.find({
    bill: { $in: bills.map((b) => b._id) },
  }).lean();
  const settleStatusByBill = new Map(settlements.map((s) => [String(s.bill), s.status]));

  const normalized = normalizeDoc(bills);
  const parsed = getBillResponseSchema.array().parse(normalized).map((p) => ({
    ...p,
    settlementStatus: settleStatusByBill.get(p.id) ?? null,
  }));
  return ApiResponse.success(res, {
    message: 'Bills fetched successfully',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
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
  const parsed = getSettleBillResponseSchema.array().parse(normalized);

  return ApiResponse.success(res, {
    message: 'Settlement Bill fetched succesfully',
    data: parsed,
    statusCode: 200,
    meta: { page, limit, count, totalPages: Math.ceil(count / limit) },
  });
};
