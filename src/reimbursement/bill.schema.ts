import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import z from 'zod';
import { BillStatus } from '../database/bill.model.js';
import { BillRouter } from './bill.routes.js';
import { ApiError } from '../libs/class/api-error.js';
import { objectId } from '../attendance/correction/correction.schema.js';
import { isPastDate } from '../libs/utils/check-date.js';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

export const billSchema = z.object({
  billImg: objectId,
  billAmount: z.number(),
  dateOfPayment: dateField.refine((date) => isPastDate(date), {
    message: 'Dates of future are not allowed',
  }),
  description: z.string().min(3).max(500),
  status: z.enum(BillStatus),
});

export const BillReviewSchema = billSchema
  .omit({ billImg: true, billAmount: true, dateOfPayment: true, description: true })
  .extend({
    id: objectId,
    status: z.enum(BillStatus),
  });

export const BillIdSchema = z.object({ id: objectId });
export type ReimbursementInputType = z.infer<typeof billSchema>;
export type BillReviewInputType = z.infer<typeof BillReviewSchema>;
