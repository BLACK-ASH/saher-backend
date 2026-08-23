import { Router } from 'express';

import { createLogSchema } from './audit-log/audit-log.schema.js';
import { createAuditLogController } from './audit-log/create-audit-log.controller.js';
import { userBalanceEnquiryController } from './balance-enquiry/user-balance-enquiry.controller.js';
import { adminCreateBill, adminSoftDeleteBill, adminUpdateBill } from './bill/admin.controller.js';
import {
  adminBillCreatSchema,
  adminBillUpdateSchema,
  userBillCreateSchema,
  userBillUpdateSchema,
} from './bill/schema.js';
import { userCreateBill, userSoftDeleteBill, userUpdateBill } from './bill/user.controller.js';
import { getBillByIdController } from './get-bill/bill-by-id.controller.js';
import { getAllBillsController } from './get-bill/get-all-bills.controller.js';
import { getAuditLogController } from './get-bill/get-audit-log.controller.js';
import { myBillsController } from './get-bill/my-bills.controller.js';
import { recycleBillsController } from './get-bill/recycle-bill.controller.js';
import { handleBillController } from './settlement/handle-bill.controller.js';
import { handleSettlementRequest } from './settlement/handle-settle.controller.js';
import { handleBillSchema, handleSettleSchema } from './settlement/schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';
import {
  searchBillController,
  searchSettleBillController,
} from './get-bill/search-bill.controller.js';

const billRouter = Router();

// User route
billRouter.post(
  '/bill',
  authorize('write', 'postReimbursement'),
  validate(userBillCreateSchema),
  userCreateBill,
);
billRouter.patch(
  '/:billId',
  authorize('update', 'postReimbursement'),
  validate(userBillUpdateSchema),
  userUpdateBill,
);
billRouter.delete('/:billId', authorize('delete', 'postReimbursement'), userSoftDeleteBill);

// Admin route
billRouter.post(
  '/admin/:user',
  authorize('write', 'preReimbursement'),
  validate(adminBillCreatSchema),
  adminCreateBill,
);
billRouter.patch(
  '/admin/:billId',
  authorize('update', 'preReimbursement'),
  validate(adminBillUpdateSchema),
  adminUpdateBill,
);
billRouter.delete('/admin/:billId', authorize('delete', 'preReimbursement'), adminSoftDeleteBill);

// Settlement route
billRouter.post(
  '/handle/:billId',
  authorize('write', 'preReimbursement'),
  validate(handleBillSchema),
  handleBillController,
);
billRouter.post(
  '/settlement/:settleId',
  authorize('write', 'preReimbursement'),
  validate(handleSettleSchema),
  handleSettlementRequest,
);

// gets bills
billRouter.get('/mybills', myBillsController);
billRouter.get('/recyclebills', authorize('read', 'preReimbursement'), recycleBillsController);
// Audit Log
billRouter.get('/audit-log', authorize('read', 'preReimbursement'), getAuditLogController);
billRouter.post(
  '/create-log',
  authorize('write', 'preReimbursement'),
  validate(createLogSchema),
  createAuditLogController,
);

// User Balance Enquiry
billRouter.get('/balance-enquiry', userBalanceEnquiryController);
billRouter.get('/bills', authorize('write', 'preReimbursement'), getAllBillsController);
billRouter.get('/', authorize('read', 'preReimbursement'), searchBillController);
billRouter.get('/:billId', authorize('read', 'preReimbursement'), getBillByIdController);
billRouter.get('/:id', authorize('read', 'preReimbursement'), searchSettleBillController);

export default billRouter;
