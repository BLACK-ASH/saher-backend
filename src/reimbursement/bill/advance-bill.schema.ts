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
  adminNote: z.string().min(3).max(500),
});
export const createAdvanceBillSchema = baseSchema;
export const updateAdvanceBillSchema = baseSchema.omit({ dateOfPayment: true }).partial();

export const advanceBillResponseSchema = z.object({
  user: z.string(),
  image: z.string(),
  amount: z.number(),
  dateOfPayment: dateField,
  adminNote: z.string(),
});
export const updateAdvanceBillResposeSchema = advanceBillResponseSchema
  .omit({ dateOfPayment: true })
  .partial();

export const updateUserSchema = z.object({
  status: z.string(),
  description: z.string(),
});

export const updateUserResponseSchema = updateUserSchema;

export type createBillInputType = z.infer<typeof createAdvanceBillSchema>;
export type updateBillInputType = z.infer<typeof updateAdvanceBillSchema>;
export type adminBillInputType = z.infer<typeof updateUserSchema>;
