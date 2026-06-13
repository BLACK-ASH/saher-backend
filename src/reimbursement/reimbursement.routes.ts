import { Router } from 'express';

import { createLogSchema } from './audit-log/audit-log.schema.js';
import { getAuditLogController } from './audit-log/get-audit-log.controller.js';
import { userBalanceEnquiryController } from './balance-enquiry/user-balance-enquiry.controller.js';
import { adminCreateBill, adminSoftDeleteBill, adminUpdateBill } from './bill/admin.controller.js';
import {
  adminBillCreatSchema,
  adminBillUpdateSchema,
  userBillCreateSchema,
  userBillUpdateSchema,
} from './bill/schema.js';
import { getBillByIdController } from './get-bill/bill-by-id.controller.js';
import { getAllBillsController } from './get-bill/get-all-bills.controller.js';
import { myBillsController } from './get-bill/my-bills.controller.js';
import { recycleBillsController } from './get-bill/recycle-bill.controller.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';
import { userCreateBill, userSoftDeleteBill, userUpdateBill } from './bill/user.controller.js';
import { handleBillController } from './settlement/handle-bill.controller.js';
import { handleSettlementRequest } from './settlement/handle-settle.controller.js';
import { createSettleSchema, handleBillSchema, handleSettleSchema } from './settlement/schema.js';

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
  '/bill/admin/:user',
  authorize('write', 'preReimbursement'),
  validate(adminBillCreatSchema),
  adminCreateBill,
);
billRouter.patch(
  '/bill/admin/:billId',
  authorize('update', 'preReimbursement'),
  validate(adminBillUpdateSchema),
  adminUpdateBill,
);
billRouter.delete(
  '/bill/admin/:billId',
  authorize('delete', 'preReimbursement'),
  adminSoftDeleteBill,
);

// Settlement route
billRouter.post(
  '/bill/handle/:billId',
  authorize('write', 'preReimbursement'),
  validate(handleBillSchema),
  handleBillController,
);
billRouter.post(
  '/bill/settle/:settleId',
  authorize('write', 'preReimbursement'),
  validate(handleSettleSchema),
  handleSettlementRequest,
);

// Reviewing bill
billRouter.get('/bill/mybills/:trashbills', myBillsController);
billRouter.get(
  '/bill/getbill/:billId',
  authorize('read', 'preReimbursement'),
  getBillByIdController,
);
billRouter.get('/bill/getallbills', authorize('read', 'preReimbursement'), getAllBillsController);

// Recycle bills
billRouter.get('/bill/recyclebills', authorize('read', 'preReimbursement'), recycleBillsController);

// Audit Log
billRouter.get('/bill/audit-log', authorize('read', 'preReimbursement'), getAuditLogController);

// User Balance Enquiry
billRouter.get('/balance-enquiry', userBalanceEnquiryController);

export default billRouter;
