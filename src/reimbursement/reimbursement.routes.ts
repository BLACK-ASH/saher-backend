import { Router } from 'express';
import { createBill, updateBill, softDeleteBill } from './bill/create-bill.controller.js';
import { authorize } from '../permission/authorize.js';
import { createBillSchema, updateBillSchema } from './bill/create-bill.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { advanceBill, advanceSoftDelete, advanceUpdate } from './bill/advance-bill.controller.js';
import { advanceBillSchema } from './bill/advance-bill.schema.js';

const billRouter = Router();

// Bill route
billRouter.post(
  '/create',
  authorize('write', 'postReimbursement'),
  validate(createBillSchema),
  createBill,
);
billRouter.put(
  '/update/:id',
  authorize('update', 'postReimbursement'),
  validate(updateBillSchema),
  updateBill,
);
billRouter.delete('/delete/:id', authorize('delete', 'postReimbursement'), softDeleteBill);

// Advance bill route
billRouter.post(
  '/bill/:userId',
  authorize('write', 'preReimbursement'),
  validate(advanceBillSchema),
  advanceBill,
);
billRouter.put(
  '/bill/update/:billId/:userId',
  authorize('update', 'preReimbursement'),
  advanceUpdate,
);
billRouter.delete(
  '/bill/delete/:billId',
  authorize('delete', 'preReimbursement'),
  advanceSoftDelete,
);

export default billRouter;
