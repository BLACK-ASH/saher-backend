import { Router } from 'express';

import {
  createLeaveTypeController,
  getAllActiveLeaveTypesController,
  updateLeaveTypeController,
} from './leave.controller.js';
import { leaveSchema, leaveTypeSchema, updateLeaveTypeSchema } from './leave.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const leaveRouter = Router();

// leaveRouter.post('/apply', validate(leaveSchema), applyLeaveController);

leaveRouter.post(
  '/type',
  authorize('write', 'leaveType'),
  validate(leaveTypeSchema),
  createLeaveTypeController,
);
leaveRouter.put(
  '/type',
  authorize('update', 'leaveType'),
  validate(updateLeaveTypeSchema),
  updateLeaveTypeController,
);
leaveRouter.get('type', getAllActiveLeaveTypesController);

export default leaveRouter;
