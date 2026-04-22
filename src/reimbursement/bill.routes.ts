import { Router } from 'express';
import { createBill, getAllBill, getMyBill, reviewBill } from './bill.controller.js';
import { authorize } from '../permission/authorize.js';
import { billSchema, BillReviewSchema } from './bill.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

export const BillRouter = Router();

BillRouter.get('/', getMyBill);
BillRouter.get('/all', getAllBill);
BillRouter.post('/create', authorize('write', 'reimbursement'), validate(billSchema), createBill);
BillRouter.put(
  '/review',
  authorize('update', 'reimbursement'),
  validate(BillReviewSchema),
  reviewBill,
);
