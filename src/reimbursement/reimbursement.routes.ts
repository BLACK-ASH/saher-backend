import { Router } from 'express';
import { createBill } from './user/create-user-bill.controller.js';
import { updateBill } from './user/update-user-bill.controller.js';
import { softDeleteBill } from './user/delete-user-bill.controller.js';
import { authorize } from '../permission/authorize.js';
import { createBillSchema, updateBillSchema } from './user/user-bill.schema.js';
import { updateAdminSchema } from './request-handler/handle.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { advanceBill } from './admin-manager/create-admin-bill.controller.js';
import { advanceSoftDelete } from './admin-manager/delete-admin-bill.controller.js';
import { advanceUpdate } from './admin-manager/update-admin-bill.controller.js';
import {
  createAdvanceBillSchema,
  updateAdvanceBillSchema,
} from './admin-manager/admin-bill.schema.js';
import { updateUserSchema } from './request-handler/handle.schema.js';
import {
  getAllBills,
  getBillById,
  myBills,
  recycleBills,
} from './review-bill/reviewing-bill.controller.js';
import { adminRequestHandler } from './request-handler/admin-handler.controller.js';
import { userRequestHandler } from './request-handler/user-handler.controller.js';

const billRouter = Router();

// User bill route
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
billRouter.delete('/delete/:id', authorize('delete', 'postReimbursement'), softDeleteBill);

// Admin bill route
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
billRouter.delete(
  '/bill/delete/:billId',
  authorize('delete', 'preReimbursement'),
  advanceSoftDelete,
);

// Handle request routes
billRouter.put(
  '/admin-handler/:billId',
  authorize('update', 'preReimbursement'),
  validate(updateAdminSchema),
  adminRequestHandler,
);
billRouter.put(
  '/user-handler/:billId',
  authorize('update', 'postReimbursement'),
  validate(updateUserSchema),
  userRequestHandler,
);

// Reviewing bill
billRouter.get('/mybills', myBills);
billRouter.get('/getbill/:billId', getBillById);
billRouter.get('/getallbills', authorize('read', 'preReimbursement'), getAllBills);

// Recycle bills
billRouter.get('/recyclebills', authorize('read', 'preReimbursement'), recycleBills);

export default billRouter;
