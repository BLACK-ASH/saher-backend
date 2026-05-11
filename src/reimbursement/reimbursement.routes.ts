import { Router } from 'express';
import {
  getAllBills,
  getBillById,
  myBills,
  recycleBills,
} from './review-bill/reviewing-bill.controller.js';
import { authorize } from '../permission/authorize.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { userCreateBill, userSoftDeleteBill, userUpdateBill } from './bill/user.controller.js';
import { adminBillCreatSchema, userBillCreateSchema, userBillUpdateSchema } from './bill/schema.js';
import { adminCreateBill } from './bill/admin.controller.js';
import { createSettleSchema, handleBillSchema, handleSettleSchema } from './settlement/schema.js';
import { handleBill } from './settlement/handle-bill.controller.js';
import { handleSettlementRequest } from './settlement/handle-settle.controller.js';

const billRouter = Router();

// User route
billRouter.post(
  '/bill',
  authorize('write', 'postReimbursement'),
  validate(userBillCreateSchema),
  userCreateBill,
);
billRouter.patch(
  '/bill/:billId',
  authorize('update', 'postReimbursement'),
  validate(userBillUpdateSchema),
  userUpdateBill,
);
billRouter.delete('/bill/:billId', authorize('delete', 'postReimbursement'), userSoftDeleteBill);

// Admin route
billRouter.post(
  '/bill/admin',
  authorize('write', 'preReimbursement'),
  validate(adminBillCreatSchema),
  adminCreateBill,
);

// Settlement route
billRouter.post(
  '/bill/handle/:billId',
  authorize('write', 'preReimbursement'),
  validate(handleBillSchema),
  handleBill,
);
billRouter.post(
  '/bill/settle/:settleId',
  authorize('write', 'preReimbursement'),
  validate(handleSettleSchema),
  handleSettlementRequest,
);

// Reviewing bill
billRouter.get('/mybills', myBills);
billRouter.get('/getbill/:billId', getBillById);
billRouter.get('/getallbills', authorize('read', 'preReimbursement'), getAllBills);

// Recycle bills
billRouter.get('/recyclebills', authorize('read', 'preReimbursement'), recycleBills);

export default billRouter;
