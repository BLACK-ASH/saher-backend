import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import z from 'zod';
import { reimbursementStatus } from '../database/reimbursement.model.js';
import { reimbursementRouter } from './reimbursement.routes.js';
import { ApiError } from '../libs/class/api-error.js';
import { objectId } from '../attendance/correction/correction.schema.js';
import { isPastDate } from '../libs/utils/check-date.js';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

export const reimbursementSchema = z.object({
  billImg: objectId,
  billAmount: z.number(),
  dateOfPayment: dateField.refine((date) => isPastDate(date), {
    message: 'Dates of future are not allowed',
  }),
  description: z.string().min(3).max(500),
  status: z.enum(reimbursementStatus),
});

export const reimbursementReviewSchema = reimbursementSchema
  .omit({ billImg: true, billAmount: true, dateOfPayment: true, description: true })
  .extend({
    id: objectId,
    status: z.enum(reimbursementStatus),
  });

export const reimbursementIdSchema = z.object({ id: objectId });
export type ReimbursementInputType = z.infer<typeof reimbursementSchema>;
export type ReimbursementReviewInputType = z.infer<typeof reimbursementReviewSchema>;
