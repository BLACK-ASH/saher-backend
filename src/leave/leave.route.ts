import { Router } from 'express';

import {
  createLeaveTypeController,
  getAllActiveLeaveTypesController,
  reviewLeaveApplicationController,
  updateLeaveApplicationController,
  updateLeaveTypeController,
} from './leave.controller.js';
import {
  createLeaveApplicationSchema,
  createLeaveTypeSchema,
  reviewLeaveApplicationSchema,
  updateLeaveApplicationSchema,
  updateLeaveTypeSchema,
} from './leave.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const leaveRouter = Router();

leaveRouter.post(
  '/type',
  authorize('write', 'leaveType'),
  validate(createLeaveTypeSchema),
  createLeaveTypeController,
);
leaveRouter.put(
  '/type/:id',
  authorize('update', 'leaveType'),
  validate(updateLeaveTypeSchema),
  updateLeaveTypeController,
);
leaveRouter.get('/type', getAllActiveLeaveTypesController);

// ------------------------Leave (Application)
leaveRouter.post(
  '/application/apply',
  authorize('write', 'leave'),
  validate(createLeaveApplicationSchema),
  createLeaveTypeController,
);

leaveRouter.put(
  '/application/review/:id',
  authorize('update', 'leave'),
  validate(reviewLeaveApplicationSchema),
  reviewLeaveApplicationController,
);

leaveRouter.put(
  '/appilication/update/:id',
  authorize('update', 'leave'),
  validate(updateLeaveApplicationSchema),
  updateLeaveApplicationController,
);
export default leaveRouter;
