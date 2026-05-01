import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import z from 'zod';
import { BillStatus } from '../../database/bill.model.js';
import { ApiError } from '../../libs/class/api-error.js';
import { objectId } from '../../libs/utils/zod-object-id.js';

const dateField = z.union([z.string().datetime(), z.date()]).transform((val) => new Date(val));

const baseSchema = z.object({
  image: objectId(),
  amount: z.number(),
  dateOfPayment: dateField,
  description: z.string().min(3).max(500),
});

export const billResponseSchema = z.object({
  user: z.string(),
  image: z.string(),
  amount: z.number(),
  dateOfPayment: dateField,
  description: z.string(),
});

export const updateBillResposeSchema = billResponseSchema.omit({ dateOfPayment: true }).partial();

export const createBillSchema = baseSchema;

export const updateBillSchema = baseSchema.omit({ dateOfPayment: true }).partial();

export const BillIdSchema = z.object({ id: objectId });
export type createBillInputType = z.infer<typeof createBillSchema>;
export type updateBillInputType = z.infer<typeof updateBillSchema>;
