import { Router } from 'express';
import { createBill } from './bill/bill.controller.js';
import { authorize } from '../permission/authorize.js';
import { createBillSchema, BillReviewSchema } from './bill/bill.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

export const BillRouter = Router();

// BillRouter.get('/', getMyBill);
// BillRouter.get('/all', getAllBill);
BillRouter.post(
  '/create',
  authorize('write', 'reimbursement'),
  validate(createBillSchema),
  createBill,
);
// BillRouter.put('/review', authorize('update', 'reimbursement'), validate(BillReviewSchema), reviewBill,);
