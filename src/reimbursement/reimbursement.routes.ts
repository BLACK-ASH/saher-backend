import { Router } from 'express';
import { createBill, updateBill, softDeleteBill } from './bill/create-bill.controller.js';
import { authorize } from '../permission/authorize.js';
import {
  updateAdminSchema,
  createBillSchema,
  updateBillSchema,
} from './bill/create-bill.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { advanceBill, advanceSoftDelete, advanceUpdate } from './bill/advance-bill.controller.js';
import {
  createAdvanceBillSchema,
  updateAdvanceBillSchema,
  updateUserSchema,
} from './bill/advance-bill.schema.js';
import { getAllBills, getBillById, myBills } from './review-bill/reviewing-bill.controller.js';

const billRouter = Router();

// Bill route
billRouter.post(
  '/create',
  authorize('write', 'postReimbursement'),
  validate(createBillSchema),
  createBill,
);
billRouter.put(
  '/update-user/:id',
  authorize('update', 'postReimbursement'),
  validate(updateBillSchema),
  updateBill,
);
billRouter.put(
  '/update-admin/:id',
  authorize('update', 'preReimbursement'),
  validate(updateAdminSchema),
  updateBill,
);
billRouter.delete('/delete/:id', authorize('delete', 'postReimbursement'), softDeleteBill);

// Advance bill route
billRouter.post(
  '/bill/create/:userId',
  authorize('write', 'preReimbursement'),
  validate(createAdvanceBillSchema),
  advanceBill,
);
billRouter.put(
  '/bill/update-admin/:billId',
  authorize('update', 'preReimbursement'),
  validate(updateAdvanceBillSchema),
  advanceUpdate,
);
billRouter.put(
  '/bill/update-user/:billId',
  authorize('update', 'postReimbursement'),
  validate(updateUserSchema),
  advanceUpdate,
);
billRouter.delete(
  '/bill/delete/:billId',
  authorize('delete', 'preReimbursement'),
  advanceSoftDelete,
);

// Reviewing bill
billRouter.get('/mybills', myBills);
billRouter.get('/getbill/:billId', getBillById);
billRouter.get('/getallbills', authorize('read', 'preReimbursement'), getAllBills);

export default billRouter;
