import { Router } from 'express';

import { applyLeaveController, createLeaveTypeController } from './leave.controller.js';
import { leaveSchema, leaveTypeSchema } from './leave.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';
import { authorize } from '../permission/authorize.js';

const leaveRouter = Router();

leaveRouter.post('/apply', validate(leaveSchema), applyLeaveController);

leaveRouter.post('/new-type', validate(leaveTypeSchema), createLeaveTypeController);

export default leaveRouter;
