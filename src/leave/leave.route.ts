import { Router } from 'express';

import { applyLeaveController } from './leave.controller.js';
import { leaveSchema } from './leave.schema.js';
import { validate } from '../libs/middleware/validate-zod-schema.js';

const leaveRouter = Router();

leaveRouter.post('/apply', validate(leaveSchema), applyLeaveController);

export default leaveRouter;
